const messagesDisplay = document.querySelector('#viewMessageBox');
const messageInput = document.querySelector('#message');
const submitButton = document.querySelector('#send-btn');

const userIdLabel = document.querySelector('#userID');
const chatSearch = document.querySelector('#chatSearch');

let db = firebase.database();

let currentUser;  // holds object of user signed in

window.onload = (event) => {
  // Use this to retain user state between html pages.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      userIdLabel.innerHTML = `Your UserID: ${currentUser.uid}`;
      console.log(currentUser);
      updateUserInfo();  // make sure name & profile pic in db are up to date
      getMessages();
      // make sure the chat is always at the bottom (latest message) when log in
      // it gives 1 second for all messages to load
      setTimeout(function(){messagesDisplay.scrollTop = messagesDisplay.scrollHeight;}, 1000)
    } else {
      window.location = 'login.html'; // If not logged in, navigate back to login page.
    }
  });
};

// We will need to store the user info with their chats to allow
// for making sure the user exists, and also to allow for storing any
// chats with people that the user has.
const updateUserInfo = () => {
    let info = {
        displayName: currentUser.displayName,
        profilePic: currentUser.photoURL,
    }
    db.ref(`users/${currentUser.uid}`).update(info);
};

const getMessages = () => {
    db.ref(`global_messages/`).on('value', (snapshot) => {
        let data = snapshot.val();
        renderMessagesAsHtml(data);
    });
}

const renderMessagesAsHtml = (data) => {
    messagesDisplay.innerHTML = ""; // clear all messages before updating to prevent duplicates
    
    for(key in data){
        let message = data[key];
        addMessage(message);
    }
};

// messages will have the most up to date name and profile pic
// because it gets the info from the DB (which has the updated user info)
const addMessage = (message) => {
    db.ref(`users/${message.createdBy}`).get().then((snapshot) => {
        let userInfo = snapshot.val();
        let m =`
            <div class="box sms">
                <p class="subtitle">${message.message}</p>
                <div class="sender">
                    <figure class="image is-24x24 profile-pic" style="display:inline-flex;">
                        <img class="is-rounded" src="${userInfo.profilePic}" alt="Profile picture of ${userInfo.displayName}"></img>
                    </figure>
                    <span id="senderName">By ${userInfo.displayName}</span>
                </div>
            </div>
            `;
        messagesDisplay.innerHTML += m;
    });
};

const submitMessage = () => {
    let m = {
        message: messageInput.value,
        createdBy: currentUser.uid,
        createdAt: Date()
    }

    db.ref(`global_messages/`).push(m).then(() => {
        messageInput.value = "";
    });
};

// You can submit the message by pressing enter
messageInput.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        submitButton.click();
    }
});


// need to make sure to create the `users/<userID` with user info BEFORE continuing!!!
const createChat = (otherUserID) => {
    console.log('Creating chat!!!');
    chatSearch.value = "";
};

chatSearch.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        createChat(chatSearch.value);
    }
})