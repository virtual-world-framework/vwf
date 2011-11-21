Installing the Ruby server on Windows
=====================================
 
Install Cygwin
--------------

Download and run setup.exe from [Cygwin](http://www.cygwin.com/install.html).

Accept the default settings, except for:

Set **Root Directory** to C:\Cygwin (with a capital C) if you’re a pedant like me and want it to look right among the other top-level directories.

*	Consider changing **Local Package Directory** to your browser downloads folder to avoid cluttering your desktop.
*   If connected to the LMI, for **Select Your Internet Connection**, choose *Use Internet Explorer Proxy Settings*.

Select a download site from the list. Choose one that seems close and reliable.

At **Select Packages**, click the *View* button once to choose the *Full* view, which is a straight list and is easier to navigate than the default nested category view.

Select the following packages for installation. Use the search box or scroll down the list to find each one. Click once on *Skip* in the *New* column to mark it for installation.

*   curl
*   gcc-g++
*   make
*   ruby

Click through to *Finish* to close Cygwin setup. Save setup.exe for later since you may need it to add or update packages.
_____________________________________________________________________________________

Install RubyGems
----------------

Cygwin’s ruby installs without the library manager, so we have to install it from source. Open a new Cygwin terminal session and issue the following commands. Don’t use the previous session since it hadn’t loaded the proxy settings.

	curl -s http://production.cf.rubygems.org/rubygems/rubygems-1.8.5.tgz | tar xzcd rubygems-1.8.5ruby setup.rb install 

_____________________________________________________________________________________	

Extract VWF from ZIP File
-------------------------

Download and extract the contents of the VWF.zip to C:\Users\YOU\path\to\your\Virtual World Framework.
_____________________________________________________________________________________

Install the Gems
----------------

Use the previous Cygwin terminal window or launch a new one and cd to your VWF development directory:

	cd "C:\Users\YOU\path\to\your\Virtual World Framework"
	
The easiest way is to type c-d-space as above, drag a VWF directory icon from Windows Explorer, drop it onto the Cygwin terminal, then hit return.

Then enter these commands:

	gem install bundler
	bundle install
	
Ignore the warning about sudo not found for bundle install. If you get linker relocation errors, you probably need to tell Cygwin to rebaseall. See [Cygwin rebaseall](http://www.heikkitoivonen.net/blog/2008/11/26/cygwin-upgrades-and-rebaseall) for details. The required rebase and dash packages should already be installed.
_____________________________________________________________________________________

Launch the Server
-----------------

	bin/thin start 
_____________________________________________________________________________________

Connect
-------

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck-and-plane](http://localhost:3000/duck-and-plane). View the excellent duck and the fascinating plane. Other applications may be available at other paths.

_____________________________________________________________________________________

For Linux and Mac
==================

Ensure RubyGems is installed. 
_____________________________________________________________________________________

Extract VWF from TAR File
-------------------------

Download and extract the contents of the VWF.tar to /Users/username/Documents/VWF
_____________________________________________________________________________________

Install the Gems
----------------

Launch a terminal window and cd to your VWF development directory:

	cd "/Users/username/Documents/VWF"

Then enter these commands:

	gem install bundler
	bundle install
	
_____________________________________________________________________________________

Connect
-------

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck-and-plane](http://localhost:3000/duck-and-plane). 

_____________________________________________________________________________________

