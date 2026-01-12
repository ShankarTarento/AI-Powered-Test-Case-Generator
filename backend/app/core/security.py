"""
Security Utilities - Password hashing and verification
"""
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt has a maximum password length of 72 bytes
MAX_PASSWORD_LENGTH = 72


def _truncate_password(password: str) -> bytes:
    """
    Truncate password to bcrypt's maximum length of 72 bytes.
    
    Args:
        password: Plain text password
        
    Returns:
        Password encoded and truncated to 72 bytes
    """
    return password.encode('utf-8')[:MAX_PASSWORD_LENGTH]


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    # Truncate password to 72 bytes (bcrypt limit)
    truncated = _truncate_password(password).decode('utf-8', errors='ignore')
    return pwd_context.hash(truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        True if password matches, False otherwise
    """
    # Truncate password to 72 bytes (bcrypt limit) for consistent verification
    truncated = _truncate_password(plain_password).decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated, hashed_password)

