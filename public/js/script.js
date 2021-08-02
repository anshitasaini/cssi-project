const messagesDisplay = document.querySelector('#viewMessageBox');
const messageInput = document.querySelector('#message');
const submitButton = document.querySelector('#send-btn');

const userIdLabel = document.querySelector('#userID');
const chatSearch = document.querySelector('#chatSearch');
const chatsBox = document.querySelector('#chatsBox');
const userToChatWith = document.querySelector('#userToChatWith');
const send_container = document.querySelector('#send-container');
const currentChat = document.querySelector('#currentChat');

let msgs = [];
let db = firebase.database();
let found;
let indivchat = false;

let currentUser;  // holds object of user signed in

let currentScroll = 0;

window.onload = (event) => {
  // Use this to retain user state between html pages.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      userIdLabel.innerHTML = `Your UserID: ${currentUser.uid}`;
      console.log(currentUser);
      updateUserInfo();  // make sure name & profile pic in db are up to date
      getMessages();
      loadIndiv();
      // make sure the chat is always at the bottom (latest message) when log in
      // it gives 1 second for all messages to load
      setTimeout(function(){messagesDisplay.scrollTop = messagesDisplay.scrollHeight;}, 1000)
    } else {
      window.location = 'login.html'; // If not logged in, navigate back to login page.
    }
  });
};

const loadIndiv = () => {
    db.ref(`users/${currentUser.uid}/chats/`).on('value', (snapshot) => {
        data = snapshot.val();
        loadSideButtons(data);
    })
}

const loadSideButtons = (data) => {
    for(key in data) {
        db.ref(`users/${key}`).get().then((snapshot) => {
            let userInfo = snapshot.val();
            let add = `<a class="box chat" href="#" onclick="switchChat('${key}')">
                                        <figure class="image is-24x24 profile-pic" style="display:inline-flex;">
                                            <img class="is-rounded" src="${userInfo.profilePic}" alt=""></img>
                                        </figure>
                                        <span class="subtitle" style="margin-left: 10px;">${userInfo.displayName}</span>
                                    </a>`;
            if (chatsBox.innerHTML.includes(add) == false) {
                console.log(chatsBox.innerHTML)
                console.log(add)
                chatsBox.innerHTML += add
            }
        })
    }
}

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
    messagesDisplay.innerHTML = "";
    db.ref(`global_messages/`).on('value', (snapshot) => {
        currentScroll = messagesDisplay.scrollTop;
        let data = snapshot.val();
        renderMessagesAsHtml(data);
    });
}

const getIndivMessages = (otherUserID) => {
    messagesDisplay.innerHTML = "";
    db.ref(`users/${currentUser.uid}/chats/${otherUserID}/`).on('value', (snapshot) => {
        currentScroll = messagesDisplay.scrollTop;
        let data = snapshot.val();
        renderIndivMessagesAsHtml(data, otherUserID);
    });
}

const renderMessagesAsHtml = (data) => {
    for(key in data){
        if(msgs.includes(key) == false){
            msgs.push(key);
            let message = data[key];
            addMessage(message);
        }
    }
};

const renderIndivMessagesAsHtml = (data, otherUserID) => {
    for(key in data){
        if(msgs.includes(key) == false){
            msgs.push(key);
            let message = data[key];
            addMessage(message);
        }
    }
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

const submitIndivMessage = (otherUserID) => {
    let m = {
        message: messageInput.value,
        createdBy: currentUser.uid,
        createdAt: Date()
    }
    db.ref(`users/${currentUser.uid}/chats/${otherUserID}/`).push(m).then(() => {
        messageInput.value = "";
    });
    db.ref(`users/${otherUserID}/chats/${currentUser.uid}/`).push(m).then(() => {
        messageInput.value = "";
    });
};

// messages will have the most up to date name and profile pic
// because it gets the info from the DB (which has the updated user info)
const addMessage = (message) => {
    db.ref(`users/${message.createdBy}`).get().then((snapshot) => {
        let userInfo = snapshot.val();
        if (message.message !== "") {
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
        }
    });
};

const addChat = (otherUserID) => {
    db.ref(`users/${otherUserID}`).get().then((snapshot) => {
        let userInfo = snapshot.val();
        db.ref(`users/${currentUser.uid}/chats/${otherUserID}`).push({
            message: "",
            createdBy: "",
            createdAt: ""
        })
        db.ref(`users/${otherUserID}/chats/${currentUser.uid}`).push({
            message: "",
            createdBy: "",
            createdAt: ""
        })
    })
}

const switchChat = (otherUserID) => {
    indivchat = true;
    send_container.innerHTML = `<button id="send-btn" class="button is-medium is-link is-outlined is-rounded" type="submit"
                            onclick="submitIndivMessage('${otherUserID}')" style="width:19%">
                            Submit Indiv
                        </button>`
    currentChat.innerHTML = `Chat with ${otherUserID}`
    getIndivMessages(otherUserID);
}

const switchGlobal = () => {
    indivchat = false;
    send_container.innerHTML = `<button id="send-btn" class="button is-medium is-link is-outlined is-rounded" type="submit"
                            onclick="submitMessage()" style="width:19%">
                            Submit
                        </button>`
    currentChat.innerHTML = `Global Chat`
    getMessages();
}

const findUser = (otherUserID) => {
    for (var i in id) {
        if (otherUserID == i) {
            userToChatWith.value = otherUserID;
        }
    }    
}

const checkUser = (otherUserID) => {
    id = ''
    userToChatWith.value = 'none'
    db.ref(`users/`).on('value', (snapshot) => {
        id = snapshot.val();
        findUser(otherUserID); 
    })
}

// need to make sure to create the `users/<userID` with user info BEFORE continuing!!!
const createChat = (otherUserID) => {
    checkUser(otherUserID);
    if (userToChatWith.value == 'none') {
        alert("Error! User ID not found!");
    }
    else {
        console.log('Creating chat!!!');
        addChat(otherUserID)
    }
    chatSearch.value = "";
};

// You can submit the message by pressing enter
messageInput.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        submitMessage()
        // if (indivchat == false) {submitMessage()}
    }
});

chatSearch.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        createChat(chatSearch.value);
    }
})