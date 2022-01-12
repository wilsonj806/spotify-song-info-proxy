const bodyParser = require('body-parser')
const axios = require('axios')
const helmet = require('helmet')
const compression = require('compression')
require('dotenv').config()

const app = require('express')()
const port = process.env.PORT || 3000
app.use(bodyParser.json())
app.use(compression())
app.use(helmet())

app.post('/songinfo', async (req, res) => {
  // see: https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
  // REQUEST AUTH TOKEN FROM SPOTIFY API

  // Build Spotify request body
  const {songUrl} = req.body
  if (!songUrl) {
    res.status(400)
    res.json({message: 'No song url'})
  }

  const regex = /(?:track\/)(?<TrackId>.+)(?:\?)/i
  const {groups: {TrackId}} = songUrl.match(regex)
  if (!TrackId) {
    res.status(400)
    res.json({message: 'Invalid Track ID'})
  }
  try {
    const tokenRequestEndpoint = 'https://accounts.spotify.com/api/token'
    const tokenRequestBody = new URLSearchParams()
    tokenRequestBody.append('grant_type', 'client_credentials')
    tokenRequestBody.append('client_id', process.env.SPOTIFY_CLIENT_ID)
    tokenRequestBody.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET)

    const {data:{access_token: accessToken}} = await axios.post(tokenRequestEndpoint,tokenRequestBody)
    /**
     * Grab the access token thru token.data.access_token
     *  build song info request headers thru:
     *  - headers = {Authorization: `Bearer ${access_token}`}
     *  - song id = something
     *  - https://api.spotify.com/v1/tracks/{track_id}?market=US
     */
    const headers = {Authorization:`Bearer ${accessToken}`}
    const endpoint = `https://api.spotify.com/v1/tracks/${TrackId}?market=US`
    const {data: {artists, name}} = await axios.get(endpoint,{headers})
    res.json({ data: {artists: artists.map(artist => artist.name), trackName: name} })
  } catch (e) {
    res.json({error: e.message})
  }
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})