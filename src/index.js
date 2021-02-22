const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const hbs = require('hbs')
const {generateMessage,generateLocationMessage } = require('./utils/messages')
const {addUser, removeUser, getUser, getUserInRoom, numberOfUsers} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const viewPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')
app.set('view engine', 'hbs')
app.set('views', viewPath)
hbs.registerPartials(partialsPath)
app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.render('index',{
        title: 'Let\'s Chat in Private',
        name: 'Abhishek Gupta',
        numberOfUsers
    })
})
app.get('/home', (req, res) => {
    res.render('index',{
        title: 'Let\'s Chat in Private',
        name: 'Abhishek Gupta',
        numberOfUsers
    })
})

app.get('/about', (req, res) => {
    res.render('about',{
        title: 'About Me',
        name: 'Abhishek Gupta'
    })
})

app.get('/join', (req, res) => {
    res.render('join.hbs',{
        title: 'Enter your name and room name to join',
        name: 'Abhishek Gupta'
    })
})

app.get('*', (req, res) =>{
    res.render('404', {
        title: 'Page Not found',
        name: 'Abhishek Gupta'
    })
})
io.on('connection', (socket) => {
    console.log('New WebSocket Connection')

    socket.on('join', (options, callback) => { //options--> {username, room}
        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('ADMIN', `Welcome ${user.username}`))
        socket.broadcast.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} joined the chat room`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        
        if(filter.isProfane(message)){
            return callback('Dont use abuse words!!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }  
    })
})
server.listen(port, () => {
    console.log(`Server is running in port ${port}!`)
})
