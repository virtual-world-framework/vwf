Installation Instructions
==========================
--------------------------

The VWF source can be downloaded from [github](https://github.com/virtual-world-framework/vwf) for both Windows and Linux.

--------------------------

Windows Installation
--------------------------
--------------------------

**Install Cygwin**

Download and run setup.exe from [Cygwin](http://www.cygwin.com/install.html).

Accept the default settings, except for:

*   Set **Root Directory** to C:\Cygwin (with a capital C).
*	Consider changing **Local Package Directory** to your browser downloads folder to avoid cluttering your desktop.

Select a download site from the list. Choose one that seems close and reliable.

At **Select Packages**, click the *View* button once to choose the *Full* view, which is a straight list and is easier to navigate than the default nested category view.

Select the following packages for installation. Use the search box or scroll down the list to find each one. Click once on *Skip* in the *New* column to mark it for installation.

*   curl
*   gcc-g++
* 	git
*   make
*   ruby
*   perl
*   python
*   p7zip

Click through to *Finish* to close Cygwin setup. Save setup.exe for later since you may need it to add or update packages.

--------------------------

**Option 1: Automatic Windows Installation**

*1.1 Shell Command*

Perform the following shell command at a user shell prompt within Cygwin:

	bash -x <( (curl http://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_windows.sh)) optProxyAddress

--------------------------

**Option 2: Manual Windows Installation**

*2.1 Install RubyGems*

Cygwin's ruby installs without the library manager, so we have to install it from source: http://rubygems.org/pages/download
Open a new Cygwin terminal session.
Unpack into a directory and cd there
Install with command: ruby setup.rb

*2.2 Extract VWF from ZIP File*

Download the latest baseline from our downloads page and extract to C:\Users\YOU\pathto\VirtualWorldFramework.

*2.3 Install the Gems*

Use the previous Cygwin terminal window or launch a new one and cd to your VWF development directory:

	cd "C:\Users\YOU\pathto\VirtualWorldFramework"
	
The easiest way is to type c-d-space as above, drag a VWF directory icon from Windows Explorer, drop it onto the Cygwin terminal, then hit return.

Then enter these commands:

	gem install bundler

	bundle install
	
	bundle exec rake build
	
Ignore the warning about sudo not found for bundle install. If you get linker relocation errors, you probably need to tell Cygwin to rebaseall. See [Cygwin rebaseall](http://www.heikkitoivonen.net/blog/2008/11/26/cygwin-upgrades-and-rebaseall) for details. The required rebase and dash packages should already be installed.

*2.4 Launch the Server*

Enter the following command:

	bundle exec thin start 

*2.5 Connect*

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). View the excellent duck and the fascinating plane. Other applications may be available at other paths.

--------------------------

Linux Installations
--------------------------
--------------------------

**1. Ubuntu/Debian Automatic Installation**

Perform the following shell command at a user shell prompt:

	sudo bash -x <( (curl http://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_debian.sh)) optProxyAddress

--------------------------

**2. Red Hat Enterprise Linux Automatic Installation**

Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_debian.sh | bash -x

--------------------------

**3. Manual Installation on Linux**

*3.1 RubyGems*

Ensure RubyGems is installed (for Debian/Ubuntu). 

	# sudo apt-get update
	# sudo apt-get install ruby1.9.1 ruby1.9.1-dev \ rubygems1.9.1 irb1.9.1 ri1.9.1 rdoc1.9.1 \ build-essential libopenssl-ruby1.9.1 libssl-dev zlib1g-dev
	# sudo update-alternatives --install /usr/bin/ruby ruby /usr/bin/ruby1.9.1 400 \
         --slave   /usr/share/man/man1/ruby.1.gz ruby.1.gz \
                        /usr/share/man/man1/ruby1.9.1.1.gz \
        --slave   /usr/bin/ri ri /usr/bin/ri1.9.1 \
        --slave   /usr/bin/irb irb /usr/bin/irb1.9.1 \
        --slave   /usr/bin/rdoc rdoc /usr/bin/rdoc1.9.1
	# sudo update-alternatives --config ruby
	# sudo update-alternatives --config gem	

Now try 
	# ruby --version

and you should get the 1.9.# baseline for ruby reported back.	
	
Or (for Red Hat/Fedora)

	# yum install ruby rubygems

Or (for OSX with Homebrew)

	Make sure you have the Command Line Tools for XCode installed: https://developer.apple.com/downloads/index.action
	
	# ruby -e "$(curl -fsSkL raw.github.com/mxcl/homebrew/go)"
	# brew install automake
	The script explains what it will do and then pauses before it does it
	
	# \curl -L https://get.rvm.io | bash -s stable --ruby
	# source ~/.rvm/scripts/rvm
	This installs RVM which is a version manager for Ruby.
	
	# rvm install 1.9.3-head
	# rvm use ruby-1.9.3-head
	# rvm rubygems current
	This adds Ruby 1.9.3 to your machine and sets 1.9.3 as the default Ruby version.

	# brew install git
	This installs git if you do not have it already on your machine.

*3.2 Extract VWF from TAR File*

Download the contents of the GitHub Master VWF Baseline to your local directory:

	$ sudo git clone http://www.github.com/virtual-world-framework/vwf --recursive

*3.3 Install the Gems*

Launch a terminal window and cd to your VWF development directory:

	$ cd vwf/

Then enter these commands:

	# sudo gem install rubygems-update
	# sudo update_rubygems 
	# sudo gem install bundler

On Debian-based systems, RubyGems is not automatically added to the path. Find the following lines in bash:

	if [ "`id -u`" -eq 0 ]; then
	  PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
	else
	  PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games"
	fi
	export PATH

And update them to:

	if [ "`id -u`" -eq 0 ]; then
	  PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/var/lib/gems/1.8/bin/"
	else
	  PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games:/var/lib/gems/1.8/bin/"
	fi
	export PATH

Now you can install the RubyGems to the system (as root):

	# sudo bundle install

*3.4 Build the Server*

    # sudo bundle exec rake build

*3.5 Launch the Server*

	# sudo bundle exec thin start

*3.6 Connect*

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). 

--------------------------

