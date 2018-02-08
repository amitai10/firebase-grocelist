
const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.addToBank = functions.firestore.document('/groceries/{documentId}')
.onCreate(event => {
  console.log('grocery created', event.data.data());
  const groceryName = event.data.data().name;
  const bankRef = admin.firestore().collection('bank_of_groceries');
  const query = bankRef.where("name", "==", groceryName);
  query.get().then(querySnapshot => {
    if (querySnapshot.empty) {
      console.log('Add to bank', groceryName);
      bankRef.add({name: groceryName})
    }  
  })
});