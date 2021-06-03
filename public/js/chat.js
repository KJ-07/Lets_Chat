// Client End
const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

/*
location object contains information about current url.
qs is a third party library for parsing and stringifying querystring.
*/
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// join(emit)
socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

socket.on('message', data => {
  const html = Mustache.render(messageTemplate, {
    USERNAME: data.username,
    MESSAGE: data.text,
    CREATEDAT: moment(data.createdAt).format('h:mm:a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

$messageForm.addEventListener('submit', e => {
  e.preventDefault();
  //disabling the form
  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = document.querySelector('input').value; // e.target.elements.message.value

  socket.emit('sendMessage', message, () => {
    console.log('✔');
    //enabling the form
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
  });
});

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation)
    return alert('GeoLocation is currently not supported in your browser.');

  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log('✔');
        $sendLocationButton.removeAttribute('disabled');
      }
    );
  });
});

socket.on('messageLocation', data => {
  const html = Mustache.render(locationTemplate, {
    USERNAME: data.username,
    URL: data.url,
    CREATEDAT: moment(data.createdAt).format('h:mm:a'),
  });

  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sideBarTemplate, {
    ROOM: room,
    USERS: users,
  });

  document.querySelector('#sidebar').innerHTML = html;
});
