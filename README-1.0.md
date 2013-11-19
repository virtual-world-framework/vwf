# Virtual World Framework

The Virtual World Framework (VWF) allows you to build collaborative, immersive applications in the browser. VWF provides:

- Realtime state synchronization.
- Support for immersive applications - a set of drivers for 3D, audio, video and modern graphics.

VWF applications are written in JavaScript and leverage emerging web technologies such as WebGL, WebRTC, and WebSockets to provide a full 3D environment that is automatically synchronized across clients.

## Installation

**Install on Mac/Linux:**

```
curl https://get.virtual.wf | bash
```

This command may be re-run to upgrade the installation to the latest version of VWF.

**Install on Windows:**

[Download and run the latest Windows installer](http://www.virtual.wf/web/downloads.html).

This exe may be re-run to upgrade the installation to the latest version of VWF.

For more complex installations, such as working on VWF core, please see our [Installation Instructions](http://www.virtual.wf/web/docs/install.html).

## Quick Start

Create a new VWF application.

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

Watch our [screencast]() for an example of building an application quickly with VWF.

For more examples, check out our [demos](http://virtual.wf/web/catalog.html).

Check out [what people are building with
VWF](http://virtual.wf/something).

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

- Have a question about VWF? Ask away on [StackOverflow](http://stackoverflow.com/questions/tagged/vwf).
- Join us in IRC on the irc.freenode.net server, in the #vwf channel.

## License

Copyright 2013 United States Government, as represented by the Secretary of Defense, Under Secretary of Defense (Personnel & Readiness) licensed under the [Apache 2.0 License](https://github.com/virtual-world-framework/vwf/blob/master/LICENSE).
