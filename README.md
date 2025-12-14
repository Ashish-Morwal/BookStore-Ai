# build-full-stack-book-store-mern-app
![full-stack-book-store-mern-project](/frontend/src/assets/github-cover.png)

## How to run this project:

### For Frontend 
Follow the below steps to run the project: 
- Firstly clone or unzip the project folder.
* Go to the frontend directory by using the following command ``` cd frontend ```.
* * create a **.env.local** file in the backend root directory as the same level where the **package.json** is located and keep the following environment variables there:
```
>>> Stepup firebase app and configure the environment

VITE_API_KEY="your_firebase_api_key"
VITE_Auth_Domain="your_project_auth_domain"
VITE_PROJECT_ID="your_project_id"
VITE_STORAGE_BUCKET="your_storage_bucket"
VITE_MESSAGING_SENDERID="your_sender_id"
VITE_APPID="your_app_id"

```
+ Then run `` npm install `` commend to install node dependencies.
- Finally, to run the project, use ``npm run dev`` command.


### For Backend
Follow the below steps to run the project: 
- Firstly clone or unzip the project folder.
* Go to the backend directory by using the following command ``` cd backend```.
+ Then run `` npm install `` commend to install node dependencies.
* create a **.env** file in the backend root directory as the same level where the **package.json** is located and keep the following environment variables there: 
```
DB_URL="your_mongodb_connection_url"
JWT_SECRET_KEY="your_jwt_secret_key"

Note: Please setup mongodb and change the MongoDB url and set your jwt secret key above.
```

- Finally, to run the project, use ``npm run start:dev`` command.
