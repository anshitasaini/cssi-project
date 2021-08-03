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
let indivchat = false;

let currentUser;  // holds object of user signed in

let currentScroll = 0;
let isScrolledAllDown = true;


// iTxWedj31lOgen3iEQiuMfxvgQF3
// bATCbG4BSOdHC01hkav70esAZe52
// RrDUNItGMiYBjUOQXxaO558FsEQ2

window.onload = (event) => {
  // Use this to retain user state between html pages.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      userIdLabel.innerHTML = `Your UserID: ${currentUser.uid}`;
      console.log(currentUser);
      updateUserInfo();  // make sure name & profile pic in db are up to date
      getMessages();
      loadIndiv();  // loads chats
    } else {
      window.location = 'login.html'; // If not logged in, navigate back to login page.
    }
  });
};

const loadIndiv = () => {
    db.ref(`users/${currentUser.uid}/chats`).on('value', (snapshot) => {
        chatsBox.innerHTML = `
        <a class="box chat" href="#" onclick="switchGlobal()">
            <figure class="image is-24x24 profile-pic" style="display:inline-flex;">
                <img class="is-rounded" src="https://www.freeiconspng.com/thumbs/global-icon/global-icon-13.png" alt="Earth icon"></img>
            </figure>
            <span class="subtitle" style="margin-left: 10px;">Global Chat</span>
        </a>
        `;
        data = snapshot.val();
        for(key in data){
            loadSideButtons(key)
        }
    })
}

const loadSideButtons = (otherID) => {
        db.ref(`users/${otherID}`).get().then((snapshot) => {
            console.log(otherID) 
            let userInfo = snapshot.val();
            if(userInfo.displayName != null && userInfo.profilePic != null){
                let add = `<a class="box chat" href="#" onclick="switchChat('${otherID}')">
                                            <figure class="image is-24x24 profile-pic" style="display:inline-flex;">
                                                <img class="is-rounded" src="${userInfo.profilePic}" alt=""></img>
                                            </figure>
                                            <span class="subtitle" style="margin-left: 10px;">${userInfo.displayName}</span>
                                        </a>`;
                if (chatsBox.innerHTML.includes(add) == false) {
                    // console.log(chatsBox.innerHTML)
                    // console.log(add)
                    chatsBox.innerHTML += add
                }
            }
        });
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
    msgs = [];
    db.ref(`global_messages/`).on('value', (snapshot) => {
        
        //this little peace of code checks if the user is scrolled all the way down
        currentScroll = messagesDisplay.scrollTop;
        // we need to subtract the CSS height because 
        if(currentScroll == messagesDisplay.scrollHeight - messagesDisplay.offsetHeight){
            isScrolledAllDown = true;
        } else {
            isScrolledAllDown = false;
        }

        let data = snapshot.val();
        renderMessagesAsHtml(data);
    });
}

const getIndivMessages = (otherUserID) => {
    messagesDisplay.innerHTML = "";
    msgs = [];
    db.ref(`users/${currentUser.uid}/chats/${otherUserID}`).on('value', (snapshot) => {
        currentScroll = messagesDisplay.scrollTop;
        let data = snapshot.val();
        renderMessagesAsHtml(data);
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
            
            // we will automatically make the user scroll all the way down if he was already scrolled all the way down before
            if(isScrolledAllDown){
                messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
            }
        }
    });

    // we will automatically make the user scroll all the way down if he was already scrolled all the way down before
    if(isScrolledAllDown){
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    }
}

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

const checkUser = async(otherUserID) => {
    userToChatWith.value = 'none'
    await db.ref(`users/`).on('value', (snapshot) => {
        ids = snapshot.val();
        for (let i in ids) {
            if (otherUserID == i) {
                userToChatWith.value = otherUserID;
            }
        } 
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
// messageInput.addEventListener('keypress', (e) => {
//     if(e.key == "Enter"){
//         submitMessage();
//     }
// });

chatSearch.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        createChat(chatSearch.value);
    }
})
