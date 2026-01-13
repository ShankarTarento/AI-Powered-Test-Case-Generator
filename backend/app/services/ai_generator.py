"""Service for AI-powered test case generation with RAG support."""
import json
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import UserStory, TestCase, TestPriority, TestStatus
from app.services.llm_orchestrator import llm_orchestrator
from app.services.knowledge_base.vector_service import vector_indexer

logger = logging.getLogger(__name__)

class AIGeneratorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_test_cases_for_story(
        self,
        story_id: UUID,
        user_id: UUID,
        provider: str = "openai",
        model: Optional[str] = None,
        use_rag: bool = True
    ) -> List[TestCase]:
        """Generate test cases for a specific user story, optionally using RAG."""
        
        # 1. Fetch story context
        result = await self.db.execute(select(UserStory).where(UserStory.id == story_id))
        story = result.scalar_one_or_none()
        if not story:
            raise ValueError("User story not found")

        # 2. Retrieve relevant historical test cases (RAG)
        context_examples = []
        if use_rag:
            query = f"{story.name}\n{story.description}"
            relevant = vector_indexer.search_relevant_entries(query, story.project_id, limit=3)
            for hit in relevant:
                payload = hit["payload"]
                context_examples.append({
                    "title": payload.get("title"),
                    "description": payload.get("description"),
                    "steps": payload.get("steps"),
                    "expected_result": payload.get("expected_result")
                })

        # 3. Construct prompt
        prompt = self._build_prompt(story, context_examples)
        
        # 4. Call LLM
        # In a real scenario, we'd fetch the user's API key. For now, we use system key via fallback.
        # TODO: Implement user API key retrieval
        llm_response = await llm_orchestrator.generate_completion(
            prompt=prompt,
            user_api_key="", # Mock empty user key to trigger system fallback
            provider=provider,
            model=model,
            system_message="You are a professional QA Engineer. Generate test cases in valid JSON format."
        )

        if not llm_response["success"]:
            logger.error(f"LLM generation failed: {llm_response.get('error')}")
            raise RuntimeError(f"AI Generation failed: {llm_response.get('error')}")

        # 5. Parse and persist test cases
        try:
            raw_content = llm_response["content"]
            # Clean possible markdown code blocks
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_content:
                raw_content = raw_content.split("```")[1].split("```")[0].strip()
                
            test_cases_data = json.loads(raw_content)
            if not isinstance(test_cases_data, list):
                test_cases_data = [test_cases_data]
            
            created_cases = []
            for case_data in test_cases_data:
                test_case = TestCase(
                    user_story_id=story.id,
                    created_by=user_id,
                    title=case_data.get("title", f"Test for {story.name}"),
                    description=case_data.get("description"),
                    steps=case_data.get("steps"),
                    expected_result=case_data.get("expected_result"),
                    priority=case_data.get("priority", TestPriority.MEDIUM.value),
                    test_type=case_data.get("test_type", "functional"),
                    status=TestStatus.DRAFT.value
                )
                self.db.add(test_case)
                created_cases.append(test_case)
            
            await self.db.flush()
            return created_cases

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}\nContent: {llm_response['content']}")
            raise RuntimeError("Failed to parse AI-generated test cases")

    def _build_prompt(self, story: UserStory, examples: List[Dict]) -> str:
        prompt = f"""Generate 3-5 comprehensive test cases for the following User Story:

JIRA KEY: {story.jira_key}
TITLE: {story.name}
DESCRIPTION: {story.description}

"""
        if examples:
            prompt += "Here are some relevant historical test cases for reference (Few-Shot Examples):\n"
            for i, ex in enumerate(examples):
                prompt += f"\nExample {i+1}:\n"
                prompt += f"Title: {ex['title']}\n"
                prompt += f"Description: {ex['description']}\n"
                prompt += f"Steps: {json.dumps(ex['steps'], indent=2)}\n"
                prompt += f"Expected Result: {ex['expected_result']}\n"
            prompt += "\n"

        prompt += """Output the generated test cases as a JSON array of objects. 
Each object must have: 'title', 'description', 'steps' (array of {step_number, action, expected_result}), 'expected_result', 'priority' (low/medium/high), and 'test_type'.
Ensure the format is strictly valid JSON."""
        
        return prompt
