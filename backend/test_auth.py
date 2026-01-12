"""
Test Authentication Endpoints
Quick script to test register, login, and token refresh
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_auth():
    """Test authentication flow"""
    
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("Testing Authentication System")
        print("=" * 60)
        
        # Test 1: Register new user
        print("\n1. Testing User Registration...")
        register_data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "full_name": "Test User"
        }
        
        try:
            response = await client.post(
                f"{BASE_URL}/auth/register",
                json=register_data
            )
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                access_token = data["access_token"]
                refresh_token = data["refresh_token"]
                print(f"   ✓ Registration successful")
                print(f"   Access Token: {access_token[:30]}...")
                print(f"   Refresh Token: {refresh_token[:30]}...")
            else:
                print(f"   ✗ Registration failed: {response.json()}")
                return
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
            return
        
        # Test 2: Get current user profile
        print("\n2. Testing Get Current User...")
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(
                f"{BASE_URL}/auth/me",
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                user = response.json()
                print(f"   ✓ User profile retrieved")
                print(f"   Email: {user['email']}")
                print(f"   Name: {user['full_name']}")
                print(f"   ID: {user['id']}")
            else:
                print(f"   ✗ Failed: {response.json()}")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
        
        # Test 3: Login with credentials
        print("\n3. Testing Login...")
        login_data = {
            "email": "test@example.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                json=login_data
            )
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                new_access_token = data["access_token"]
                print(f"   ✓ Login successful")
                print(f"   New Access Token: {new_access_token[:30]}...")
            else:
                print(f"   ✗ Login failed: {response.json()}")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
        
        # Test 4: Refresh token
        print("\n4. Testing Token Refresh...")
        try:
            response = await client.post(
                f"{BASE_URL}/auth/refresh",
                json={"refresh_token": refresh_token}
            )
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Token refresh successful")
                print(f"   New Access Token: {data['access_token'][:30]}...")
            else:
                print(f"   ✗ Refresh failed: {response.json()}")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
        
        # Test 5: Invalid credentials
        print("\n5. Testing Invalid Credentials...")
        try:
            response = await client.post(
                f"{BASE_URL}/auth/login",
                json={"email": "test@example.com", "password": "WrongPassword"}
            )
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✓ Correctly rejected invalid credentials")
            else:
                print(f"   ✗ Unexpected response: {response.json()}")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
        
        print("\n" + "=" * 60)
        print("Authentication Testing Complete!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_auth())
