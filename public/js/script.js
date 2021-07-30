const messagesDisplay = document.querySelector('#viewMessageBox');
const messageInput = document.querySelector('#message');
const submitButton = document.querySelector('#send-btn');

let db = firebase.database();

let currentUser;  // holds object of user signed in

window.onload = (event) => {
  // Use this to retain user state between html pages.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log('Logged in as: ' + user.displayName);
      currentUser = user;
      console.log(currentUser);
      getMessages();
      // make sure the chat is always at the bottom (latest message) when log in
      // it gives 1 second for all messages to load
      setTimeout(function(){messagesDisplay.scrollTop = messagesDisplay.scrollHeight;}, 1000)
    } else {
      window.location = 'login.html'; // If not logged in, navigate back to login page.
    }
  });
};

const getMessages = () => {
    db.ref(`messages/`).on('value', (snapshot) => {
        let data = snapshot.val();
        renderMessagesAsHtml(data);
    });
}

const renderMessagesAsHtml = (data) => {
    messagesDisplay.innerHTML = ""; // clear all messages before updating to prevent duplicates
    
    for(key in data){
        let message = data[key];
        messagesDisplay.innerHTML += createMessage(message);
    }
};

const createMessage = (message) => {
    return `
            <div class="box sms">
                <p class="subtitle">${message.message}</p>
                <div class="sender">
                    <figure class="image is-24x24 profile-pic" style="display:inline-flex;">
                        <img class="is-rounded" src="${message.profilePic}" alt="Profile picture of ${message.displayName}"></img>
                    </figure>
                    <span id="senderName">By ${message.createdBy}</span>
                </div>
            </div>
            `
};

const submitMessage = () => {
    let m = {
        message: messageInput.value,
        createdBy: currentUser.displayName,
        profilePic: currentUser.photoURL,
        createdAt: Date()
    }

    db.ref(`messages/`).push(m).then(() => {
        messageInput.value = "";
    });
};

// You can submit the message by pressing enter
messageInput.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        submitButton.click();
    }
});