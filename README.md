== Wowza + HLS Streaming PoC ==

This should work out of the box.  This assumes the following things:

* You've got docker setup
* You're on OSX (or possibly Linux?)
* You have a valid license key
* You are using OBS for testing (at least for now)


Create a file called `.credentials` in your root directory.  It needs to have the following:

```
WSE_LIC=YOUR-LICENSE-KEY ## Your license
WSE_MGR_USER=username2 ## Username you want to log in as
WSE_MGR_PASS=password1 ## Password you want to log in with
```

Then, start wowza server by running `./run-wowza`

Next, start up the express server by running `node server.js`.  Now you should be able to go to http://localhost:8088 and sign in as whatever username and password you put in the run-wowza script

Startup OBS now, and add a source (use "Display Capture" if you want something easy and don't mine inception).  Next, click settings and then Stream, and for the url, use `rtmp://localhost:1935/live`.

For the stream key, use whatever you want, but remember it because you'll need it later.

Check 'use authentication' and use the username and password you setup in the first step.

Now click Apply, then "OK", then "Start Stream".  It should change to "Stop Stream" to indicate you're streaming now to Wowza.

In a browser, you should now be able to go to http://localhost:3000/?streamKey=obs-stream-key

=== Notes ===
* On my macbook, it seems like the stream is ~20 seconds behind live.
* Coincidentally, it takes about 20 seconds after you start streaming to be able to connect to the stream
* If you log into the Wowza server at http://localhost:8088 after streaming, you can click on Applications->live->Incoming Streams and you should see your stream there.  From there, click on "Test Players" in the top right corner and you should be able to test various players, as well as seeing the URLS they use from Wowza
