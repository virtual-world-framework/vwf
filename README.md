# Virtual World Framework

The Virtual World Framework (VWF) allows you to build collaborative, immersive applications in the browser. VWF provides:

- Realtime state synchronization.
- Support for immersive applications - a set of drivers for 3D, audio, video and modern graphics.

VWF applications are written in JavaScript and leverage emerging web technologies such as WebGL, WebRTC, and WebSockets to provide a full 3D environment that is automatically synchronized across clients.

## Installation

**Install on Linux / Mac OSX**

NOTE: On Mac OSX, please make sure you have XCode, and XCode Command Line Tools installed prior to executing the script below (https://developer.apple.com/xcode/).

```
$ curl http://get.virtual.wf  | sh
```

This command may be re-run to upgrade the installation to the latest version of VWF.

**Install on Windows**

- Download the latest VWF Windows Build zip file from http://virtualworldframework.com/web/downloads.html.

- Execute the _run.bat_ file provided at the root level of the extracted folder.

For more complex installations, such as working on VWF core, please see our [Installation Instructions](http://www.virtual.wf/web/docs/install.html).

## Quick Start 

**Quick Start - Linux/Mac OSX** 

Navigate to a directory on your computer (we use the home directory as an example).

```
$ cd ~
```

Create a new folder for your app. Run 'vwf' to start up the web server. 

```
$ mkdir my-app
$ cd my-app
$ vwf
```

The webpage will be blank at http://localhost:3000. You are now ready to get started with VWF. 
Check out [Getting Started](http://virtual.wf/web/docs/readme.html).

Go back to the root VWF directory and start the server.

**Quick Start - Windows** 

Execute the _run.bat_ file provided at the root level of the extracted folder.

```
c:\vwf> run
```

Your application is now up and running at [http://localhost:3000/my-app](http://localhost:3000/my-app).

## Examples

For examples, check out our [demos](http://www.virtual.wf/web/catalog.html).

Also, browse through other example applications in the `public` folder of your
local VWF repository.

## Contributing

Our development process utilizes several branches:

* `master`                - Stable release of VWF. Running on http://virtual.wf.
* `integration`           - Integration testing features from development before merging into master. Running on http://integration.virtual.wf.
* `development`           - The latest development and new features of the framework. Running on http://development.virtual.wf.
* `branch/feature-name`   - Feature development is done on a feature branch before being merged back to development.

When submitting a pull request, please use the `development` branch.

Also, please be sure that your pull request conforms to our [Coding Standard](http://redmine.virtualworldframework.com/projects/vwf/wiki/JavaScript_Coding_Standard).

## Community

Keep track of developments and get help with VWF.

- Discover an issue? Head over to [Issues](https://github.com/virtual-world-framework/vwf/issues) and report it.
- Have a question about VWF? Ask away on [our forum](http://www.virtual.wf/web/forum.html).

## License

Copyright 2013 United States Government, as represented by the Secretary of Defense, Under Secretary of Defense (Personnel & Readiness) licensed under the [Apache 2.0 License](https://github.com/virtual-world-framework/vwf/blob/master/LICENSE).
