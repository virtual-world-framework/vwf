Installation Instructions
==========================
--------------------------

The VWF source can be downloaded from GitHub: [https://github.com/virtual-world-framework](https://github.com/virtual-world-framework)

--------------------------

The Virtual World Framework (VWF) can be run on both Windows and Linux. 

Windows
==============
There are two options for running VWF on Windows: 
	
*   Simple (Automatic Version) The simplest way is to run the self-contained version. Download and extract the contents of the VWF.zip file. Double click 'run.bat' in the extracted folder. 
*   Hands on - Install the Ruby Server

* * *
 
Installing the Ruby Server - For Windows
==============

Install Cygwin
--------------

Download and run setup.exe from [Cygwin](http://www.cygwin.com/install.html).

Accept the default settings, except for:

*   Set **Root Directory** to C:\Cygwin (with a capital C).
*	Consider changing **Local Package Directory** to your browser downloads folder to avoid cluttering your desktop.

Select a download site from the list. Choose one that seems close and reliable.

At **Select Packages**, click the *View* button once to choose the *Full* view, which is a straight list and is easier to navigate than the default nested category view.

Select the following packages for installation. Use the search box or scroll down the list to find each one. Click once on *Skip* in the *New* column to mark it for installation.

*   curl
*   gcc-g++
*   make
*   ruby
*   perl
*   python

Click through to *Finish* to close Cygwin setup. Save setup.exe for later since you may need it to add or update packages.

* * *

Option 1: Automatic Windows Installation
--------------
Perform the following shell command at a user shell prompt within Cygwin:

	curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_windows.sh | bash optProxyAddress

* * *

Option 2: Manual Windows Installation
----------------

Cygwin's ruby installs without the library manager, so we have to install it from source. Open a new Cygwin terminal session and issue the following commands.

	curl -s http://production.cf.rubygems.org/rubygems/rubygems-1.8.24.tgz | tar xz

	cd rubygems-1.8.24

	ruby setup.rb install 

* * *

Extract VWF from ZIP File
-------------------------

Download and extract the contents of the VWF.zip to C:\Users\YOU\pathto\VirtualWorldFramework.

* * *

Install the Gems
----------------

Use the previous Cygwin terminal window or launch a new one and cd to your VWF development directory:

	cd "C:\Users\YOU\pathto\VirtualWorldFramework"
	
The easiest way is to type c-d-space as above, drag a VWF directory icon from Windows Explorer, drop it onto the Cygwin terminal, then hit return.

Then enter these commands:

	gem install bundler

	bundle install --binstubs
	
Ignore the warning about sudo not found for bundle install. If you get linker relocation errors, you probably need to tell Cygwin to rebaseall. See [Cygwin rebaseall](http://www.heikkitoivonen.net/blog/2008/11/26/cygwin-upgrades-and-rebaseall) for details. The required rebase and dash packages should already be installed.

* * *

Launch the Server
-----------------

	bin/thin start 

* * *

Connect
-------

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). View the excellent duck and the fascinating plane. Other applications may be available at other paths.

* * *

Installing the Ruby Server - For Linux
=========

Ubuntu/Debian
-------
Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_debian.sh  | bash

* * *

Red Hat Enterprise Linux
-------
Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_redhat.sh  | bash

* * *



Manual Installation on Linux
-------
Ensure RubyGems is installed (for Debian/Ubuntu). 

	# apt-get install ruby rubygems

Or (for Red Hat/Fedora)

	# yum install ruby rubygems

Or (for OSX with Boo)

	# boo install ruby rubygems

* * *

Extract VWF from TAR File
-------------------------

Download and extract the contents of the vwf.tar to your development directory.

	$ tar -xvzf vwf.tar

* * *

Install the Gems
----------------

Launch a terminal window and cd to your VWF development directory:

	$ cd vwf/

Then enter these commands:

	# gem install bundler

On Debian-based systems, RubyGems are not automatically added to the path. Find the lines that look like this:

	if [ "`id -u`" -eq 0 ]; then
	  PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
	else
	  PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games"
	fi
	export PATH

And make them look like this:

	if [ "`id -u`" -eq 0 ]; then
	  PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/var/lib/gems/1.8/bin/"
	else
	  PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games:/var/lib/gems/1.8/bin/"
	fi
	export PATH

Now you can install the RubyGems to the system (as root):

	# bundle install --binstubs

* * *

Build the Server
-----------------

    # bundle exec rake build

Launch the Server
-----------------

	# bundle exec thin start

* * *

Connect
-------

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). 

* * *

