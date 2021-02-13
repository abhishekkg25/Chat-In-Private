const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight
    
    //container Height
    const containerHeight = $messages.scrollHeight

    //how far i've scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight -  newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        createdAt: moment(message.createdAt).format('hh:mm a'),
        message: message.text   //message:message
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationMessageTemplate, 
        {
            username:url.username,
            createdAt: moment(url.createdAt).format('hh:mm a'),
            url: url.url   //message:message
        }
    )
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit',(e) =>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
       if(error){
           return console.log(error)
       }
       console.log('Message Delievered!')
    })
})


$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!!')
        })
    })

})

socket.emit('join', {username, room }, (error) =>{
    if(error){
        alert(error)
        location.href = '/'
    }
})