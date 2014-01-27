# Virtual World Framework

The Virtual World Framework (VWF) allows you to build collaborative, immersive applications in the browser. VWF provides:

- Realtime state synchronization.
- Support for immersive applications - a set of drivers for 3D, audio, video and modern graphics.

VWF applications are written in JavaScript and leverage emerging web technologies such as WebGL, WebRTC, and WebSockets to provide a full 3D environment that is automatically synchronized across clients.

## Installation

**Install on Mac/Linux**

NOTE: On Mac OS X, please make sure you have Xcode Command Line Tools installed prior to executing the script below (https://developer.apple.com/xcode/).

```
$ curl -kL http://get.virtual.wf  | sh
```

This command may be re-run to upgrade the installation to the latest version of VWF.

**Install on Windows**

- Download the latest [Virtual World Framework for Windows Installer](http://download.virtualworldframework.com/files/VWF_Windows_Install.exe) and run the executable.

For more complex installations, such as working on VWF core, please see our [Installation Instructions](http://www.virtual.wf/web/docs/install.html).

## Quick Start 

Create a new VWF application from command prompt/terminal/shell:

```
$ vwf create my-app
```

Change directory into that app and run the application.

```
$ cd my-app
$ vwf
```

Your application is now up and running at [http://localhost:3000](http://localhost:3000).

To get started with VWF, check out [Getting Started](http://virtual.wf/web/docs/readme.html).

## Examples

For examples, check out our [demos](http://www.virtual.wf/web/catalog.html).

Also, browse through other example applications in the `public` folder of your
local VWF repository.

## Contributing

Our development process utilizes several branches:

* [![Build Status](http://jenkins.virtualworldframework.com/job/Master/badge/icon)](http://jenkins.virtualworldframework.com/job/Master/) **master** - Stable release of VWF. Running on http://virtual.wf.
* [![Build Status](http://jenkins.virtualworldframework.com/job/Integration/badge/icon)](http://jenkins.virtualworldframework.com/job/Integration/) **integration** - Integration testing features from development before merging into master. Running on http://integration.virtual.wf.
* [![Build Status](http://jenkins.virtualworldframework.com/job/Development/badge/icon)](http://jenkins.virtualworldframework.com/job/Development/) **development** - The latest development and new features of the framework. Running on http://development.virtual.wf.
* **branch/feature-name**   - Feature development is done on a feature branch before being merged back to development.

When submitting a pull request, please use the `development` branch.

Also, please be sure that your pull request conforms to our [Coding Standard](http://redmine.virtualworldframework.com/projects/vwf/wiki/JavaScript_Coding_Standard).

## Community

Keep track of developments and get help with VWF.

- Discover an issue? Head over to [Issues](https://github.com/virtual-world-framework/vwf/issues) and report it.
- Have a question about VWF? Ask away on [our forum](http://www.virtual.wf/web/forum.html).

## License

Copyright 2014 United States Government, as represented by the Secretary of Defense, Under Secretary of Defense (Personnel & Readiness) licensed under the [Apache 2.0 License](https://github.com/virtual-world-framework/vwf/blob/master/LICENSE).
