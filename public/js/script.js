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

let indivchat = 'global_messages';
let currentChatRef = db.ref(`global_messages`);  // default is Global

let currentUser;  // holds object of user signed in
let username;

let currentScroll = 0;
let isScrolledAllDown = true;

// Anshita's ID:
// iTxWedj31lOgen3iEQiuMfxvgQF3
// Max's ID:
// bATCbG4BSOdHC01hkav70esAZe52
// Kayden's ID:
// RrDUNItGMiYBjUOQXxaO558FsEQ2

window.onload = (event) => {
// Use this to retain user state between html pages.
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
    currentUser = user;
    updateUserInfo();  // make sure name & profile pic in db are up to date
    userIdLabel.innerHTML = `Your Username: ${username}`;
    console.log(currentUser);
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
        <a class="box chat" href="#" onclick="switchChat('global_messages')">
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
            let userInfo = snapshot.val();
            if(userInfo.displayName != null && userInfo.profilePic != null){
                let add = `<a class="box chat" href="#" onclick="switchChat('${otherID}')">
                                            <figure class="image is-24x24 profile-pic" style="display:inline-flex;">
                                                <img class="is-rounded" src="${userInfo.profilePic}" alt=""></img>
                                            </figure>
                                            <span class="subtitle" style="margin-left: 10px;">${userInfo.displayName}</span>
                                        </a>`;
                if (chatsBox.innerHTML.includes(add) == false) {
                    chatsBox.innerHTML += add
                }
            }
        });
}

// We will need to store the user info with their chats to allow
// for making sure the user exists, and also to allow for storing any
// chats with people that the user has.
const updateUserInfo = () => {
    email = currentUser.email
    username = email.substring(0, email.indexOf('@'))
    let info = {
        displayName: currentUser.displayName,
        profilePic: currentUser.photoURL,
        username: username
    }
    db.ref(`users/${currentUser.uid}`).update(info);
};

const getMessages = () => {
    messagesDisplay.innerHTML = "";
    msgs = [];
    currentChatRef.on('value', (snapshot) => {
        
        //this little piece of code checks if the user is scrolled all the way down
        currentScroll = Math.round(messagesDisplay.scrollTop-3);
        console.log(currentScroll, messagesDisplay.scrollHeight - messagesDisplay.offsetHeight);
        // we need to subtract the CSS height because 
        if(currentScroll == Math.round(messagesDisplay.scrollHeight - messagesDisplay.offsetHeight)){
            isScrolledAllDown = true;
        } else {
            isScrolledAllDown = false;
        }

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

    // uploading to OTHER USER CHATS
    if (indivchat != 'global_messages') {
        db.ref(`users/${indivchat}/chats/${currentUser.uid}`).push(m);
    }

    // uploading to OUR USER CHATS
    currentChatRef.push(m).then(() => {
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
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span style="margin-left: auto">@${userInfo.username}</span>
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
    currentChatRef.off(); // turn off chat before
    msgs = [];
    messagesDisplay.innerHTML = "";

    indivchat = otherUserID;
    
    if(indivchat == 'global_messages'){
        currentChatRef = db.ref(`global_messages/`);
        currentChat.innerHTML = `Global Chat`;

        getMessages();
    } else {
        currentChatRef = db.ref(`users/${currentUser.uid}/chats/${otherUserID}`);
        db.ref(`users/${otherUserID}`).get().then((snapshot) =>{
            let userInfo = snapshot.val();
            currentChat.innerHTML = `Chat with ${userInfo.displayName}`;
            getMessages(otherUserID);
        });
    }    
}

const findUser = (allUsers, otherUsername) => {
    for (i in allUsers) {
        if (allUsers[i].username == otherUsername) {
            userToChatWith.value = i;
        }
    }
    otherUserID = userToChatWith.value
    db.ref(`users/${otherUserID}`).get().then((snapshot) => {
        let userInfo = snapshot.val();
        if (userToChatWith.value == 'none') {
            alert("Error! User ID not found!");
        }
        else {
            console.log('Creating chat!!!');
            addChat(otherUserID)
        }
        chatSearch.value = "";
    })
}

const checkUser = (otherUsername) => {
    userToChatWith.value = 'none'
    db.ref(`users/`).get().then((snapshot) => {
        let data = snapshot.val();
        findUser(data, otherUsername);
    })
}

// need to make sure to create the `users/<userID` with user info BEFORE continuing!!!
const createChat = (otherUsername) => {
    checkUser(otherUsername);
};

// You can submit the message by pressing enter
messageInput.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        submitMessage();
    }
});

chatSearch.addEventListener('keypress', (e) => {
    if(e.key == "Enter"){
        createChat(chatSearch.value);
    }
})


const selectThemeElement = document.querySelector('#changeMode');

const cssiMode = (themeCSSlink) => {
    console.log('CSSI');
    themeCSSlink.setAttribute('href', 'css/cssi_stylesheet.css');
};

const lightMode = (themeCSSlink) => {
    console.log('Light');
    themeCSSlink.setAttribute('href', 'css/light_stylesheet.css');
};

const darkMode = (themeCSSlink) => {
    console.log('Dark');
    themeCSSlink.setAttribute('href', 'css/dark_stylesheet.css');
}

const toggleTheme = (option) => {
    // Obtains an array of all <link> elements.
    // Select the element using indexing.
    let themeCSSlink = document.querySelectorAll('link')[2]; // the third CSS is our style.css
    
    // Change the value of href attribute to change the css sheet.
    if (option.includes("Dark")) {
        darkMode(themeCSSlink);
    } else if(option.includes("CSSI")) {
        cssiMode(themeCSSlink);
    } else if(option.includes("Light")){
        lightMode(themeCSSlink);
    } else {
        console.log(option);
        console.log("Something is wrong? This option is invalid.")
    }
};

// listens for changes in the Theme Selector
selectThemeElement.addEventListener('change', (e) => {
    // will be CSSI Mode , Dark Mode , or Light Mode
    let selectedTheme = selectThemeElement.options[selectThemeElement.selectedIndex].value;
    toggleTheme(selectedTheme);
});
