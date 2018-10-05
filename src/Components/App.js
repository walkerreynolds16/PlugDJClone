import React, { Component } from 'react';
import Routes from '../Routes/Routes'
import Login from '../Components/Login'
import YouTube from 'react-youtube';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { Button, ListGroup, ListGroupItem, Modal } from 'react-bootstrap';
import Slider from 'react-slide-out'
import Axios from 'axios'
import '../Styles/App.css';
import 'react-slide-out/lib/index.css'

import openSocket from 'socket.io-client';
import { constants } from 'zlib';
const  socket = openSocket.connect('http://127.0.0.1:5000')




var video = ''
const youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'
const apiEndpoint = 'http://127.0.0.1:5000'

const listStyle = {
  display: 'inline-block',
  position: 'fixed',
  width: '25%',
  top: '5px',
  left: '5px'
}

const playerStyle = {
  display: 'inline',
  position: 'relative',
  left: '25%',
  marginLeft: '20px',
  top: '5px'
}

const SortableItem = SortableElement(({value, onClickDeleteCallback, listIndex }) => {
  var image = 'http://img.youtube.com/vi/' + value.videoId + '/0.jpg'
  
  return (
    <div style={{'marginTop':'8px', 'marginBottom':'8px', 'position':'relative'}}>
      <li style={{'display': 'flex', 'alignItems': 'center' }}>
        <img src={image} style={{ 'width': '80px', 'height': '55px' }} />
        <h6 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px' }}>{value.videoTitle}</h6>

        <Button bsStyle={'small'} 
                style={{'display':'inline-block', 'position':'absolute', 'right':'5px'}} 
                onClick={() => onClickDeleteCallback(listIndex)}>

                <svg width="11" height="11" viewBox="0 0 1024 1024">
                  <path d="M192 1024h640l64-704h-768zM640 128v-128h-256v128h-320v192l64-64h768l64 64v-192h-320zM576 128h-128v-64h128v64z"></path>
                </svg>

        </Button>
      </li>
    </div>

  );
});

const SortableList = SortableContainer(({ items, onClickDeleteCallback }) => {
  return (
    <div style={{'overflow':'auto', 'height':'600px'}}>
      <ul>
        {items.map((value, index) => (
          
          <SortableItem key={`item-${index}`} index={index} value={value} onClickDeleteCallback={onClickDeleteCallback} listIndex={index} />
        ))}
      </ul>
    </div>
    
  );
});


class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      currentPlaylist: {playlistTitle: '', playlistVideos: []},
      showAddVideoModal: false,
      addVideoSearchTerm: '',
      playerWidth: '',
      playerHeight: '',
      searchList: [],
      currentUser: 'walker',
      showPlaylistSlideIn: false,
      playlists: [
        {playlistTitle: '', playlistVideos: []}
      ],
      showAddPlaylistModal: false,
      newPlaylistNameInput: '',
      testMessages: [],
      userPlayingVideo: ''

    }
  }


  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions);

    this.getPlaylistsForCurrentUser()

    socket.on('connect', () => this.handleConnect())

    socket.on('message', (msg) => this.handleMessage(msg))

    socket.on('Event_videoFromServer', (data) => this.handleVideoFromServer(data))

  }

  handleConnect = () => {
    socket.send('User has connected')
    // socket.emit('customEvent', {eventName: 'customEvent', currentPlaylist: this.state.currentPlaylist})
  }

  handleMessage = (msg) => {
    console.log(msg)
    var copy = this.state.testMessages.slice()

    copy.push(msg)

    this.setState({
      testMessages: copy
    })

    this.forceUpdate()
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    var width = window.innerWidth * .65
    var height = width * (9 / 16)

    this.setState({
      playerWidth: (width) + 'px',
      playerHeight: (height) + 'px',
    })
  }

  // This function is called when the sortable list is sorted
  onSortEnd = ({ oldIndex, newIndex }) => {
    var newCurrentPlaylist =  {playlistTitle: this.state.currentPlaylist.playlistTitle , playlistVideos: arrayMove(this.state.currentPlaylist.playlistVideos, oldIndex, newIndex)}

    this.setState({
      currentPlaylist: newCurrentPlaylist,
    });

    if(newIndex === 0){
      video = newCurrentPlaylist.playlistVideos[0].videoId
      this.forceUpdate()
    }

    this.setBackEndPlaylist(newCurrentPlaylist)

  }

  onReady(event) {
    // access to player in all event handlers via event.target
    event.target.pause
  }

  onPlayerStateChange = (event) => {
    if (event.data === 0) {
      this.skipCurrentVideo()
    }
  }

  skipCurrentVideo = () => {

    if(this.state.currentPlaylist.playlistVideos.length > 0){
      console.log('skipping')
      var topItem = this.state.currentPlaylist.playlistVideos.splice(0, 1)
      var listCopy = this.state.currentPlaylist.playlistVideos.slice()
  
  
      listCopy.push(topItem[0])
      video = listCopy[0].videoId
  
      var newPlaylist = {playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: listCopy}
  
      this.updatePlaylistState(newPlaylist)
  
  
      this.setState({
        currentPlaylist: newPlaylist
      })
  
      this.forceUpdate()
    }else {
      alert('There are no videos in the current playlist')
    }
    
  }

  sendMessage = (msg) => {
    socket.send(msg)
  }

  onShowAddVideoModal = () => {
    this.setState({
      showAddVideoModal: true
    })
  }

  onCloseAddVideoModal = () => {
    this.setState({
      showAddVideoModal: false,
      searchList: [],
      addVideoSearchTerm: ''
    })
  }

  handleAddVideoIDChange = (event) => {
    this.setState({
      addVideoSearchTerm: event.target.value
    })
  }

  onAddVideoSearch = (e) => {
    if (e !== undefined) {
      e.preventDefault();
    }

    var q = this.state.addVideoSearchTerm
    var maxResults = 25
    var url = 'https://www.googleapis.com/youtube/v3/search?q=' + q + '&key=' + youtubeAPIKey + '&maxResults=' + maxResults + '&part=snippet'

    if (q.length >= 1) {
      Axios.get(url)
        .then(response => {
          console.log(response)

          var results = response['data']['items']
          var searchList = []

          for (var i = 0; i < results.length; i++) {
            var item = results[i]

            var videoId = item['id']['videoId']
            var videoTitle = item['snippet']['title']

            if (videoId !== undefined) {
              //add videos to a list to be displayed on the modal
              searchList.push({ videoId: videoId, videoTitle: videoTitle })

            }

          }

          this.setState({
            searchList: searchList
          })

        })
    }

  }

  //add new item to the front end playlist
  //also call backend to update record
  onSearchListItemClicked = (index) => {

    //Make a copy of the current playlist's videos
    var list = this.state.currentPlaylist.playlistVideos.slice()
    //Make a copy of the video search results
    var searchRes = this.state.searchList.slice()

    //Add the clicked video to the copy of the current playlist's videos
    list.push(searchRes[index])

    //Make a new object for the playlists state
    var newPlaylist = {playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: list}
    
    this.updatePlaylistState(newPlaylist)

    this.setState({
      currentPlaylist: newPlaylist
    })

    this.forceUpdate()

    //Update backend for new video
    this.addVideoToPlaylist(searchRes[index])

    
  }

  //This function is used to update the playlists state with an updated playlist
  //Finds the playlist with the same name as the new playlist and replaces it
  updatePlaylistState = (newPlaylist) => {
    //Make a copy of all the playlists
    var playlistsCopy = this.state.playlists.slice()

    //Find the playlist that was just changed in the copy
    //Switch the old playlist with the new one
    for(var i = 0; i < playlistsCopy.length; i++){
      if(playlistsCopy[i].playlistTitle === newPlaylist.playlistTitle){
        playlistsCopy[i] = newPlaylist
      }
    }

    this.setState({
      playlists: playlistsCopy
    })

    this.forceUpdate()
  }

  //This function is used for adding a video to the current backend playlist
  addVideoToPlaylist = (video) => {

    var data = {
      username: this.state.currentUser,
      playlistTitle: this.state.currentPlaylist.playlistTitle,
      videoId: video['videoId'],
      videoTitle: video['videoTitle']
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'    

    var url = apiEndpoint + '/addVideoToPlaylist'
    Axios.post(url, data)
      .then((response) => {
        console.log(response)
      })

  }

  getVideoTitle = (videoId) => {
    var url = 'https://www.googleapis.com/youtube/v3/videos?key=' + youtubeAPIKey + '&id='+ videoId +'&part=snippet'
    var title = ''
    Axios.get(url)
      .then((response) => {
        return response['data']['items'][0]['snippet']['title']
      })

    return title
  }

  //This function is usually called when returning the playlist for a user from the DB
  //The function goes through each item in the list provided and adds it to current playlist
  setFrontEndPlaylist = (playlists) => {
    console.log('frontend')
    console.log(playlists)
    var currentPlaylistVideos = playlists['playlists'][0]['playlistVideos']
    var videoList = []

    for(const item of currentPlaylistVideos){
      var videoId = item['videoId']
      var videoTitle = item['videoTitle']

      var obj = {videoId: videoId, videoTitle: videoTitle}

      videoList.push(obj)

    }

    var newPlaylist = {playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: videoList}

    this.setState({
      currentPlaylist: newPlaylist
    })

    // if(videoList.length > 0){
    //   video = videoList[0]['videoId']

    // }


    //
    this.forceUpdate()


  }

  //This function is usually called after sorting a playlist
  //The function takes the current playlist and sends it to the backend to be put in the db
  setBackEndPlaylist = (newList) => {
    
    var data = {
      username: this.state.currentUser,
      playlistVideos: newList.playlistVideos,
      playlistTitle: newList.playlistTitle
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/setPlaylist'

    Axios.post(url, data)
      .then((response) => {
        console.log(response)
      })

  }

  getPlaylistsForCurrentUser = () => {
    var url = apiEndpoint + '/getPlaylists?username=' + this.state.currentUser
    Axios.get(url)
      .then((response) => {
        console.log(response)

        if (response.data.length !== 0) {
          this.setFrontEndPlaylist(response.data)

          this.setState({
            playlists: response.data.playlists,
            currentPlaylist: response.data.playlists[0]
          })

        } else {
          console.log('No Playlist for this user')
        }

      })
  }

  openPlaylistSlideIn = () => {
    this.setState({
      showPlaylistSlideIn: true
    })
  }

  closePlaylistSlideIn = () => {
    this.setState({
      showPlaylistSlideIn: false
    })
  }

  changeCurrentPlaylist = (index) => {
    var playlistsCopy = this.state.playlists.slice()
    var newPlaylist = playlistsCopy[index]

    if(newPlaylist.playlistTitle === this.state.currentPlaylist.playlistTitle){
      alert("The selected playlist is already the current playlist")
    }else {

      this.setState({
        currentPlaylist: newPlaylist
      })

      this.forceUpdate()
    }


  }

  testButton = () => {
    var url = apiEndpoint + '/getPlaylists?username=' + this.state.currentUser
    Axios.get(url)
      .then((response) => {
        console.log(response)
      })
  }

  openAddPlaylistModal = () => {
    this.setState({
      showAddPlaylistModal: true
    })
  }

  closeAddPlaylistModal = () => {
    this.setState({
      showAddPlaylistModal: false
    })
  }

  handleNewPlaylistNameChange = (event) => {
    this.setState({
      newPlaylistNameInput: event.target.value
    })
  }

  makeNewPlaylist = (e) => {
    if (e !== undefined) {
      e.preventDefault();
    }

    var playlistCopy = this.state.playlists.slice()
    var newPlaylist = {playlistTitle: this.state.newPlaylistNameInput, playlistVideos: []}

    var isDuplicatePlaylistName = false
    for(var i = 0; i < playlistCopy.length; i++){
      if(this.state.newPlaylistNameInput === playlistCopy[i].playlistTitle){
        isDuplicatePlaylistName = true
      }
    }

    if(!isDuplicatePlaylistName){
      playlistCopy.push(newPlaylist)

      this.setState({
        playlists: playlistCopy
      })

      this.setBackEndPlaylist(newPlaylist)

      this.closeAddPlaylistModal()
    } else {
      alert('This playlist name is already used')
    }

    

    this.setState({
      playlists: playlistCopy
    })
  }

  //This function should only be used for debugging
  onClickListVideo = (index) => {
    console.log('callback')
    console.log('Index = ' + index)

    video = this.state.currentPlaylist.playlistVideos[index].videoId

    this.forceUpdate()
  }

  onClickDeleteCallback = (index) => {
    console.log('Index = ' + index)

    // Delete from frontend stuff

    // Delete from current playlist
    var cpCopy = this.state.currentPlaylist
    var deletedVideo = cpCopy.playlistVideos.splice(index, 1)[0]

    // Delete from playlist state
    this.updatePlaylistState(cpCopy)

    this.setState({
      currentPlaylist: cpCopy
    })

    // call backend to delete video off playlist
    // this.deleteVideoFromBackend(deletedVideo, cpCopy.playlistTitle)
    this.setBackEndPlaylist(cpCopy)


  }

  // Apparently, Pymongo can't remove one element at a time so if there was a duplicate video in a playlist, both would be deleted
  // New idea, delete video from front end, the set backend list to the front end list
  // I will leave this function for possible future use
  deleteVideoFromBackend = (deletedVideo, playlistTitle) => {
    var data = {
      videoId: deletedVideo.videoId,
      videoTitle: deletedVideo.videoTitle,
      playlistTitle: playlistTitle,
      username: this.state.currentUser
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/deleteVideoInPlaylist'

    Axios.post(url, data)
      .then((response) => {
        console.log(response)
      })

  }

  // This function is called when a use joins the DJ queue
  // Sends the username to the server
  onJoinDJ = () => {
    socket.emit('Event_joinDJ', 
      {
       user: this.state.currentUser,
       nextVideo: this.state.currentPlaylist.playlistVideos[0]
      }
    )
  }

  // This function is called when the server broadcasts a new videoId
  handleVideoFromServer = (data) => {
    console.log(data)
    var videoId = data.nextVideo.videoId
    var userPlayingVideo = data.user

    video = videoId
    this.setState({
      userPlayingVideo: userPlayingVideo
    })

    this.forceUpdate()
  }

  

  render() {
 
    const opts = {
      width: this.state.playerWidth,
      height: this.state.playerHeight,
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        controls: 0,
        disablekb: 1
      }
    };

    var playlistSlideInTitle = 'Current Playlist: ' + this.state.currentPlaylist.playlistTitle

    return (
      <div >
        <Routes />
        <div style={listStyle}>
          <fieldset style={{ 'border': 'p2' }}>

            {this.state.testMessages.map((value, index) => {
              var string = index + ' - ' + value
                return (
                  <h6>{string}</h6>
                )
              })
            }

            <Button onClick={this.onShowAddVideoModal}>Add Video</Button>
            <Button style={{'marginLeft':'5px'}} onClick={this.openPlaylistSlideIn}>Playlists</Button>
            <Button style={{'marginLeft':'5px'}} onClick={() => this.skipCurrentVideo()}>Skip Video</Button>
            <Button style={{'marginLeft':'5px'}} onClick={() => this.onJoinDJ()}>Click to DJ</Button>

            <Button style={{'marginLeft':'10px'}} onClick={this.openPlaylistSlideIn}>Test</Button>
            

            <div style={{ 'marginTop': '10px' }}>
              <SortableList
                items={this.state.currentPlaylist.playlistVideos}
                onSortEnd={this.onSortEnd}
                distance={5}
                onClickDeleteCallback={this.onClickDeleteCallback} />
            </div>


          </fieldset>
        </div>

        <div style={playerStyle}>
          <YouTube
            videoId={video}
            opts={opts}
            onReady={this.onReady}
            onStateChange={this.onPlayerStateChange} />

        </div>

        <div>
          
            <input type="text" id="messageBox"></input>
            <Button onClick={(e) => this.sendMessage("" + this.refs.messageBox)}>Send</Button>
         
        </div>


        <Modal show={this.state.showAddVideoModal} onHide={this.onCloseAddVideoModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Add Video to List</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>

              <form onSubmit={(e) => this.onAddVideoSearch(e)}>
                <input value={this.state.addVideoSearchTerm} onChange={this.handleAddVideoIDChange} />
                <Button onClick={(e) => { this.onAddVideoSearch(e) }}>Search</Button>
              </form>

              <ListGroup>
                {this.state.searchList.map((value, index) => {
                  var imageLink = 'http://img.youtube.com/vi/' + value.videoId + '/0.jpg'

                  return (
                    <ListGroupItem style={{ 'position': 'relative' }} onClick={() => this.onSearchListItemClicked(index)}>
                      <img src={imageLink} style={{ 'width': '120px', 'height': '90px' }} />
                      <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{value.videoTitle}</h5>
                      {/* <Button bsSize="large" style={{'position':'fixed', 'right':'5px', 'top':'20px'}} onClick={() => this.onSearchListItemClicked(index)}>+</Button> */}
                    </ListGroupItem>
                  )

                })}
              </ListGroup>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.onCloseAddVideoModal}>Close</Button>
          </Modal.Footer>
        </Modal>


        <Slider
          title={playlistSlideInTitle}
          isOpen={this.state.showPlaylistSlideIn}
          onOutsideClick={this.closePlaylistSlideIn}
          header={
            <div style={{'position':'fixed'}}>
              <Button style={{'right':'5px', 'position':'fixed', 'top':'15px'}} onClick={this.openAddPlaylistModal}>Add Playlist</Button>
            </div>
          }>
          
          <div>
            <ListGroup>
              {this.state.playlists.map((value, index) => {
                var title = value.playlistTitle
                var videos = value.playlistVideos

                return (
                  <ListGroupItem style={{ 'position': 'relative' }} onClick={() => this.changeCurrentPlaylist(index)}>
                    <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{title}</h5>
                    <h6 style={{'display':'inline-block', 'marginLeft':'2px'}}>({videos.length})</h6>
                  </ListGroupItem>
                )
              })}
            </ListGroup>
          </div>

        </Slider>

        <Modal show={this.state.showAddPlaylistModal} onHide={this.closeAddPlaylistModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Add New Playlist</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>

              <form onSubmit={(e) => this.makeNewPlaylist(e)}>
                <input value={this.state.newPlaylistNameInput} onChange={this.handleNewPlaylistNameChange} />
                <Button onClick={(e) => { this.makeNewPlaylist(e) }}>Add</Button>
              </form>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeAddPlaylistModal}>Close</Button>
          </Modal.Footer>
        </Modal>

      </div>
    );
  }
}

export default App;
