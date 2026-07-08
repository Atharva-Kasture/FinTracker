#Importing libraries
from pydantic import BaseModel

#Class for user sign up data validation
class UserSignUp(BaseModel):
    username: str
    email: str
    password: str

#Class for user login data validation
class UserLogin(BaseModel):
    username: str
    password: str

#Class for response data validation
class Token(BaseModel):
    access_token: str
    token_type: str
