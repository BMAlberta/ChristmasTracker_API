# Christmas Tracker (API)

The Christmas Tracker project aims to solve an annual problem of coordinating Christmas lists and givers across an extended family.

## Data Architecture
The REST API consists of 2 layers; API and persistence.

### API 
The API layer was written in JavaScript utilizing Node.js. Node was chosen for its ease of use and readily available documentation. I also experimented with using multiple middlewares for logging, authentication via JWT, and Async/Await.

### Persistence Layer
I chose to use MongoDB for the database layer. The data used in this application fit the model of a document based database. Additionally, Mongoose makes interactions with the database very simple.

Stay tuned for more updates.
