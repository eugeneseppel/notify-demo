# Notify Demo

This application is a simple demonstration of some of the features of Twilio Notify. It demonstrates the following features:
- Multi-channel notifications: APNS, Facebook Messenger, SMS
- Simple orchestration: Select the preferred channel of a user
- User segmentation: Group all users that want to receive marketing communication

Before we begin, we need to configure a few things:

Configuration | Description
---------- | -----------
Twilio APN Credential | Authorizes Twilio to send notificaitons to your iOS app - [create one here](https://www.twilio.com/console/notify/credentials). You'll need to provision your APN push credentials to create this. See [this](https://www.twilio.com/docs/api/notifications/guides/configuring-ios-push-notifications) guide on how to do that. (Optional)
Twilio Messaging Service | Adds SMS sending capability to your app. You can create one [here](https://www.twilio.com/console/sms/services).
Facebook page and app | This allows us to send notifications to users via Facebook Messenger. Follow our [guide](https://www.twilio.com/docs/api/notifications/guides/messenger-notifications) to set it up.
Twilio Notify Service | The main configuration and container for your Notify usage. You can set one up in the [Twilio console](https://www.twilio.com/console/notify/services). Don't forget to configure it to use the Twilio APN Credential, Twilio Messaging Service and Facebook page configured above.

# Setting up the Node.js Application

Edit the `config.js` file with the Notify Service SID and your Twilio account's credentials.

Next, we need to install our dependencies from npm:

```bash
npm install
```

Now we should be all set! Run the application using the `npm` command.

```bash
npm start
```

Your application should now be running at [http://localhost:3000/index.html](http://localhost:3000/index.html).

# Usage

You can manage users' notification preferences with this app. After entering a username, you can register for Messenger and SMS on the website. You can also download the [quickstart iOS app](https://github.com/TwilioDevEd/notifications-quickstart-swift) and register for APNS. Make sure that you configure your server's (ngrok) URL in the ViewController.

Once registered you can select the preferred Binding of a user. You can also opt in to marketing messages. These create appropriate tags ("preferred" and "marketingEnabled") on the user's Bindings if you click submit.

To send a notifications try the following commands:

Send a notification to all registered devices of Bob:
```bash
curl -X POST -u <ACCOUNT_SID>:<AUTH_TOKEN> -d 'Body=Your pizza is arriving in 5 mins.&Identity=Bob' "https://notify.twilio.com/v1/Services/<SERVICE_SID>/Notifications"
```

Send a notification to the preferred device of Bob:
```bash
curl -X POST -u <ACCOUNT_SID>:<AUTH_TOKEN> -d 'Body=Your pizza is arriving in 5 mins.' -d 'Identity=Bob' -d 'Tag=preferred' "https://notify.twilio.com/v1/Services/<SERVICE_SID>/Notifications"
```

Send a notification to the preferred device of everyone who opted into to marketing:
```bash
curl -X POST -u <ACCOUNT_SID>:<AUTH_TOKEN> -d 'Body=Use PIZZA20 for 20% discount on pizza from Papa Pizza in the next 7 days.' -d 'Tag=marketingEnabled' -d 'Tag=preferred' "https://notify.twilio.com/v1/Services/<SERVICE_SID>/Notifications"
```
That's it!

## License

MIT
