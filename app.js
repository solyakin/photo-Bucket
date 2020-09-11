const firebaseConfig = {
    apiKey: "AIzaSyCSp55FzkV77IRN1b-Yyqehc951UAjHTWc",
    authDomain: "photo-app-6c396.firebaseapp.com",
    databaseURL: "https://photo-app-6c396.firebaseio.com",
    projectId: "photo-app-6c396",
    storageBucket: "photo-app-6c396.appspot.com",
    messagingSenderId: "1062308473681",
    appId: "1:1062308473681:web:dfd3af50a95bc0d6c60170"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

const firestore = firebase.firestore(); 

const span = document.querySelector('span');
const toggle = document.querySelector('.toggle');
const nav = document.querySelector('nav');
const head = document.querySelector('.tits');

const form = document.querySelector('#createForm');
const submitBtn = document.querySelector('#submitBtn');
const progressHandler = document.querySelector('#progressHandler');
const progressBar = document.querySelector('#progressBar');
const root = document.querySelector('#root');
const loading = document.querySelector('#loading');
const post = document.querySelector('#post');
const editFormContainer = document.querySelector('.editFormContainer');
const editBtn = document.querySelector('#editBtn');
const deleteBtn = document.querySelector('#deleteBtn')
let editMode = false;

nav.addEventListener('click', ()=>{
    toggle.style.display = 'block';
    head.style.marginLeft = "10em";
    //toggle.style.transition = '0.5s'
})

span.addEventListener('click', () =>{
    toggle.style.display = 'none'
    head.style.marginLeft = "0em"
})

//posting the image and storing data into database
if(form != null){
    let d;
    form.addEventListener('submit', async(e) =>{
        e.preventDefault();

        let title = document.getElementById('title').value;
        let content = document.getElementById('content').value;
        let cover = document.getElementById('cover').files[0];

        if(title != '', content != '', cover != ''){
            // console.log(title);
            // console.log(content);
            // console.log(cover);

            //creating the storage path in firebase
            const storageRef = firebase.storage().ref();
            const storageChild = storageRef.child(cover.name);

            const postCover = storageChild.put(cover);
            console.log('file uploading');

            await new Promise((resolved) => {
                //our async returns a promise, if resolved we want to check what we posted with the 'on' method which has an statechanged method and a callback method. 
                postCover.on('state_changed', (snapshot) =>{
                    //handling the progess bar
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(Math.floor(progress));
 
                    if(progressHandler != null){
                        progressHandler.style.display = 'block';
                    };
                    if(progressBar != null){
                        progressBar.value = progress;
                    };
                    if(form != null){
                        submitBtn.disabled = true;
                    } 
                }, (error) =>{
                    console.log(error)
            
                    //now we download the image url so we can store it with ohter datas into the database
                }, async() =>{
                    const downloadURL = await storageChild.getDownloadURL();
                    d = downloadURL;
                    console.log(d);
                    resolved();
                });
            })

           const fileRef = await firebase.storage().refFromURL(d);

            //saving into the database
            let post = {
                title : title,
                content : content,
               cover : d,  //https//:firebasestorage.com/my-image
                //fileref : fileRef.location.path  //image.jpg 
            }
            await firestore.collection("posts").add(post);
            console.log("added post succesfully");

            if(submitBtn != null){
                window.location.replace('index.html');
                submitBtn.disabled = false;
            }

         }else {
             console.log('you must enter all input fields')
         };
     })
}

const getPosts = async() => {
    let postsArray = [];
    let docs = await firebase.firestore().collection('posts').get().catch(error => console.log(error));
    docs.forEach(doc => {
        postsArray.push({'id': doc.id, 'data': doc.data()});
    });
    posts(postsArray);
}

//displaying post on the indexpage
const posts = async (arr) =>{
    if(root != null){
        arr.map( post =>{
            let div = document.createElement('div');
            let cover = document.createElement('div');
            let anchor = document.createElement('a');
            let text = document.createTextNode(post.data.title);
            anchor.setAttribute('href', 'editpost.html#/' + post.id);

            anchor.appendChild(text);
            cover.style.backgroundImage = 'url(' + post.data.cover + ')';
            div.classList.add('post');
            div.appendChild(cover);
            div.appendChild(anchor);
            root.appendChild(div);
        })
    }
}

//WORKING ON THE EDIT POST

//getting the post id from the url
const getPostIdFromURL = () =>{
    let postLocation = window.location.href;
    let href = postLocation.split('/');
    let postId = href.slice(-1).pop();
    console.log(postId);
    return postId;
    
};


//retriveing the post from the firebase for editPost.html page
 const getPost = async() =>{

    let postId = getPostIdFromURL();
    if(loading != null){
      loading.innerHTML = "<div><div class='lds-circle'><div></div></div><p>Loading Post...</p></div>";     
    };
    let doc = await firebase.firestore().collection('posts').doc(postId).get().catch(err => console.log(err));
    createChild(doc.data());
}

//markup for a child
const createChild = (postData) => {
    markUp = `
    <div class="childPost">
        <h2>${postData.title}</h2>
        <img src="${postData.cover}" alt=""></br>
        <textarea cols="30" rows="10">${postData.content}</textarea>
    </div>
    `
    post.insertAdjacentHTML("afterbegin", markUp);
};

//handling the edit form 

if (editBtn != null){
    editBtn.addEventListener('click', () => {
        if(editMode == false){
            editMode = true;
            appendEditForm();
        }else {
            editMode = true;
            removeEditForm()
        };
        
    })
}

const appendEditForm = async () => {
    let postId = getPostIdFromURL();
    let doc = await firebase.firestore().collection('posts').doc(postId).get().catch(err => console.log(err));
    let d;
    markUp =  `
    <form action="" method="post" id="editForm">
        <input type="text" value="${doc.data().title}" id="editTitle"></br>
        <textarea id="editContent">${doc.data().content}</textarea></br>
        <input type="file" id="editCover">
        <input type="hidden" value="${doc.fileref}" id="oldCover"></br>
        <input type="submit" id="edit" value="Update Post">
    </form>
    `
    editFormContainer.insertAdjacentHTML('beforeend', markUp)

    //updating the editFORM to the storage
    document.getElementById('editForm').addEventListener('submit', async(e) => {
        e.preventDefault();
    
        const postId = await getPostIdFromURL();
    
        if(document.getElementById('editTitle').value != "" && document.getElementById('editContent').value != "" ){
            if(document.getElementById('editCover').files[0] !== undefined ){
                const cover = document.getElementById('editCover').files[0];
                const storageRef = firebase.storage().ref();
                const storageChild = storageRef.child(cover.name);
                const postCover = storageChild.put(cover);
    
                console.log('file uploading');
    
                await new Promise((resolved) => {
                    //our async returns a promise, if resolved we want to check what we posted with the 'on' method which has an statechanged method and a callback method. 
                    postCover.on('state_changed', (snapshot) =>{
                        //handling the progess bar
                        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(Math.floor(progress));
    
                        if(progressHandler != null){
                            progressHandler.style.display = 'block';
                        };
                        if(progressBar != null){
                            progressBar.value = progress;
                        };
                        if(form != null){
                            submitBtn.disabled = true;
                        }
                    }, (error) =>{
                        console.log(error)
                
                        //now we download the image url so we can store it with ohter datas into the database
                    }, async() =>{
                        const downloadURL = await storageChild.getDownloadURL();
                        d = downloadURL;
                        console.log(d);
                        resolved();
                    });
                })
                const fileRef = await firebase.storage().refFromURL(d);
    
                await storageRef.child(document.getElementById('oldCover').value).delete().catch(err => console.log(err));
                console.log('previous image deleted!');
    
                let post = {
                    title : document.getElementById('editTitle').value,
                    content : document.getElementById('editContent').value,
                    cover : d,
                    //fileref : fileRef.location.path
                }
                await firebase.firestore().collection('posts').doc(postId).set(post, {merge: true})
                location.reload();
            }else {
                await firebase.firestore.collection('post').doc(postId).set({
                    title : document.getElementById('editTitle').value,
                    content : document.getElementById('editContent').value
                }, {merge: true});
                location.reload();
            }
        }else{
            console.log('enter all fields')
        }
    })
}

const removeEditForm = () => {
    const editForm = document.querySelector('#editForm');
    //editFormContainer.removeChild(editForm);
}




//deleting a post
if(deleteBtn != null){
    deleteBtn.addEventListener('click', async() =>{
        let postId = getPostIdFromURL();
        let post = await firebase.firestore().collection('posts').doc(postId).catch(err => console.log(err));

        const storageRef = firebase.storage().ref();
        await storageRef.child(post.data().fireref).delete().catch(err => console.log(err));

        await firebase.firestore().collection('posts').doc(postId).delete();

        window.location.replace('index.html');
    })
}
//checking if dom is fully loaded

document.addEventListener('DOMContentLoaded', (e) =>{
    getPosts();
    getPost();
})


//alternating way
// postsArray.map( post =>{
// var markup;
//         markup = `
//         <div class = "post">
//             <div>
//             </div>
//             <a href = "${}"
//         </div>
//         `
// })