<a name="install" />

<div class="well" markdown="1">
Installation Instructions
==========================
--------------------------
</div>

--------------------------

<div class="well" markdown="1">
Source Code
--------------------------
--------------------------

The VWF source can be downloaded from [github](https://github.com/virtual-world-framework/vwf) for both Windows and Linux.
</div>

--------------------------
<div class="well" markdown="1">
Windows Installation
--------------------------
--------------------------

**1. Install Cygwin**

Download and run setup.exe from [Cygwin](http://www.cygwin.com/install.html).

Accept the default settings, except for:

*   Set **Root Directory** to C:\Cygwin (with a capital C).
*	Consider changing **Local Package Directory** to your browser downloads folder to avoid cluttering your desktop.

Select a download site from the list. Choose one that seems close and reliable.

At **Select Packages**, click the *View* button once to choose the *Full* view, which is a straight list and is easier to navigate than the default nested category view.

Select the following packages for installation. Use the search box or scroll down the list to find each one. In the table, find the *New* column.  In this column, you will see packages listed typically with the word *Skip*.  Click on the word *Skip* in the *New* column will change the word to *Install*.  If the word is *Keep*, you already have the package needed installed.  We will want to change the following packages to *Install* by clicking on the word *Skip* to change the word.  Once the following listed packages are all marked for *Install* or *Keep* in the New column of the table, you may continue.

*   curl
*   gcc-g++
* 	git
*   make
*   ruby
*   openssl
*   perl
*   python
*   p7zip
*   libxml2
*   libxml2-devel
*   libxslt
*   libxslt-devel

Click through to *Finish* to close Cygwin setup. Save setup.exe for later since you may need it to add or update packages.

--------------------------

**2. Install Java**

Please make sure your computer has the latest version of Java installed.  You may install java from [Java's Website](http://www.java.com)

--------------------------

**Option A: Automatic Windows Installation**

*A.1 Shell Command*

Please make sure your HTTP_PROXY and HTTPS_PROXY environment variable are set in cygwin. Please make sure your git http proxy are also set (ie. git config --global http.proxy http://yourproxy.com)

Perform the following shell command at a user shell prompt within Cygwin:

	curl -k https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_windows.sh | bash -x

--------------------------

**Option B: Manual Windows Installation**

*B.1 Install RubyGems*

Cygwin's ruby installs without the library manager, so we have to install it from source: [http://rubygems.org/pages/download](http://rubygems.org/pages/download)
Open a new Cygwin terminal session.
Unpack into a directory and cd there
Install with command: ruby setup.rb

*B.2 Extract VWF from ZIP File*

[Download](../downloads.html) the latest release and unzip to your user directory (for example, "C:\Users\YOU\pathto\VirtualWorldFramework") to ensure that you have full directory permissions.

**Note:** Windows' built-in zip utility may report path length errors when unzipping.  We recommend [7-Zip](http://www.7-zip.org/) (free), [WinRAR](http://www.rarlab.com/) (not free), or [WinZip](http://www.winzip.com/win/en/index.htm) (not free) to unzip the file.

*B.3 Install the Gems*

Use the previous Cygwin terminal window or launch a new one and cd to your VWF development directory:

	cd "C:\Users\YOU\pathto\VirtualWorldFramework"
	
The easiest way is to type c-d-space as above, drag a VWF directory icon from Windows Explorer, drop it onto the Cygwin terminal, then hit return.

Then enter these commands:

	gem install bundler

	bundle install
	
	bundle exec rake 
	
Ignore the warning about sudo not found for bundle install. If you get linker relocation errors, you probably need to tell Cygwin to rebaseall. See [Cygwin rebaseall](http://www.heikkitoivonen.net/blog/2008/11/26/cygwin-upgrades-and-rebaseall) for details. The required rebase and dash packages should already be installed.

*B.4 Launch the Server*

Enter the following command:

	bundle exec thin start 

*B.5 Connect*

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). View the excellent duck and the fascinating plane. Other applications may be available at other paths.
</div>
--------------------------
<div class="well" markdown="1">
Linux Installations
--------------------------
--------------------------

**1. Ubuntu/Debian Automatic Installation**

Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_debian.sh | bash -x

--------------------------

**2. Red Hat Enterprise Linux Automatic Installation**

Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_redhat.sh | bash -x

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

	Make sure you have the [Command Line Tools for XCode](https://developer.apple.com/downloads/index.action) installed.
	
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

    # sudo bundle exec rake 

*3.5 Launch the Server*

	# sudo bundle exec thin start

*3.6 Connect*

The server runs on port 3000 in development mode by default. Use Google Chrome to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). 
</div>
--------------------------

<div class="well" markdown="1">
Node.js Server Installation / Launch / Debug
--------------------------
--------------------------

**Installation**

--------------------------

*1. Install Node.js for your specific environment [http://www.nodejs.org](http://www.nodejs.org).  At the time of this update the current version was v0.10.20.*  

*2.	Download the VWF source from [github](https://github.com/virtual-world-framework/vwf).*

*3.	Launch a terminal window and cd to your VWF root directory.  For windows a ‘node.js command prompt’ was provided with the node.js windows install.  Cygwin may also be used assuming the Cygwin Windows Installation instructions have been successfully completed.  Caveat, there are known issues using Node.js with Cygwin.*

    $ cd "//path/to/VirtualWorldFramework"

*4.	Run the Node Package Manager (npm) to install the correct version of the node module dependencies.  npm is included with your Node.js install.  This will construct the node_modules directory at the top level VWF.*

    $ npm install

*5.	(Optional) Check to see that all packages were successful installed.*

    $ npm ls 

--------------------------

**Launch Node Server**

--------------------------

*6.	Launch the node server.*

    $ npm start

or

    $ node node-server.js -a ./public

The `-a` or `--applicationPath` options can be used to specify where to serve
VWF applications from. `node-server` defaults to serving applications from
the current directory, so be sure to specify the public directory using 
`-a` or `--applicationPath` if you want to run from the root of your VWF
installation.

*7. Connect*

The server runs on port 3000 in development mode by default. Use your browser to connect to [http://localhost:3000/duck](http://localhost:3000/duck) and [http://localhost:3000/plane](http://localhost:3000/plane). 

--------------------------

**Node.js Debugging Tool**

--------------------------

One option for Node.js runtime debugging is the 'node-inspector' tool.  To use the tool do the following:

*1. Install the node-inspector (from root VWF directory).*
    
    $ npm install -g node-inspector   //global install

*2. Run node-inspector from your terminal.*
    
    $ node-inspector &

 *3. Run the node server with debug flag.*

     $ npm run debug

or

     $ node --debug node-server.js -a ./public

or to pause the debugger at start

     $ node --debug-brk node-server.js  -a ./public

 *4. In your browser go to [http://127.0.0.1:8080/debug?port=5858](http://127.0.0.1:8080/debug?port=5858) and use as you would with your typical browser tools.*

 Additional configuration options can be found at [https://github.com/node-inspector/node-inspector](https://github.com/node-inspector/node-inspector)

</div>
<div class="well" markdown="1">
Configuring HTTPS/SSL Traffic
--------------------------
--------------------------

The Virtual World Framework is able to work over an HTTPS/SSL configuration.  Below we outline how to setup a Linux environment running Thin web server with SSL as this is our preferred operational environment for the VWF server; however you may use SSL for any combination of operating system, and we ask that if you do configure and run SSL installations on other platforms that you please generate a Pull Request on GitHub and update this page with instructions on your preferred platform. Thank you in advance!

The following is an extremely simplified view of how SSL is implemented and what part the certificate plays in the entire process.

Normal web traffic is sent unencrypted over the Internet. That is, anyone with access to the right tools can snoop all of that traffic. Obviously, this can lead to problems, especially where security and privacy is necessary, such as in credit card data and bank transactions. The Secure Socket Layer is used to encrypt the data stream between the web server and the web client (the browser).

### Step 1. Generate a Private Key
<br/>
The openssl toolkit is used to generate an RSA Private Key and CSR (Certificate Signing Request). It can also be used to generate self-signed certificates which can be used for testing purposes or internal usage.

The first step is to create your RSA Private Key. This key is a 1024 bit RSA key which is encrypted using Triple-DES and stored in a PEM format so that it is readable as ASCII text.

    openssl genrsa -des3 -out server.key 1024

Generating RSA private key, 1024 bit long modulus<br/>
.........................................................++++++<br/>
........++++++<br/>
e is 65537 (0x10001)<br/>
Enter PEM pass phrase:<br/>
Verifying password - Enter PEM pass phrase:<br/><br/>
 
### Step 2: Generate a CSR (Certificate Signing Request)
<br/>
Once the private key is generated a Certificate Signing Request can be generated. The CSR is then used in one of two ways. Ideally, the CSR will be sent to a Certificate Authority, such as Thawte or Verisign who will verify the identity of the requestor and issue a signed certificate. The second option is to self-sign the CSR, which will be demonstrated in the next section.

During the generation of the CSR, you will be prompted for several pieces of information. These are the X.509 attributes of the certificate. One of the prompts will be for "Common Name (e.g., YOUR name)". It is important that this field be filled in with the fully qualified domain name of the server to be protected by SSL. If the website to be protected will be https://public.akadia.com, then enter public.akadia.com at this prompt. The command to generate the CSR is as follows:

    openssl req -new -key server.key -out server.csr

Country Name (2 letter code) \[GB\]:US<br/>
State or Province Name (full name) \[Berkshire\]:Florida<br/>
Locality Name (eg, city) \[Newbury\]:Orlando<br/>
Organization Name (eg, company) \[My Company Ltd\]:Test<br/>
Organizational Unit Name (eg, section) []:Test Technology<br/>
Common Name (eg, your name or your server's hostname) []:public.whatever.com<br/>
Email Address []:test@test.com<br/>
Please enter the following 'extra' attributes<br/>
to be sent with your certificate request<br/>
A challenge password:<br/>
An optional company name:<br/><br/>

### Step 3: Remove Passphrase from Key
<br/>
One unfortunate side-effect of the pass-phrased private key is that Apache will ask for the pass-phrase each time the web server is started. Obviously this is not necessarily convenient as someone will not always be around to type in the pass-phrase, such as after a reboot or crash. mod_ssl includes the ability to use an external program in place of the built-in pass-phrase dialog, however, this is not necessarily the most secure option either. It is possible to remove the Triple-DES encryption from the key, thereby no longer needing to type in a pass-phrase. If the private key is no longer encrypted, it is critical that this file only be readable by the root user! If your system is ever compromised and a third party obtains your unencrypted private key, the corresponding certificate will need to be revoked. With that being said, use the following command to remove the pass-phrase from the key:

    cp server.key server.key.org
    openssl rsa -in server.key.org -out server.key

The newly created server.key file has no more passphrase in it.

-rw-r--r-- 1 root root 745 Jun 29 12:19 server.csr
-rw-r--r-- 1 root root 891 Jun 29 13:22 server.key
-rw-r--r-- 1 root root 963 Jun 29 13:22 server.key.org

### Step 4: Generating a Self-Signed Certificate
<br/>
At this point you will need to generate a self-signed certificate because you either don't plan on having your certificate signed by a CA, or you wish to test your new SSL implementation while the CA is signing your certificate. This temporary certificate will generate an error in the client browser to the effect that the signing certificate authority is unknown and not trusted.

To generate a temporary certificate which is good for 365 days, issue the following command:

    openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

Signature ok<br/>
subject=/C=CH/ST=Test/L=TestName/O=Test Co/OU=Test Technology/CN=public.whatever.com/Email=test@test.com<br/>
Getting Private key<br/>

### Step 5: Installing the Private Key and Certificate
<br/>
Thin is capable of reading SSL within a configuration yml file for startup.  First we move the certificates generated to a permanent location.

    mkdir /etc/thin_ssl
    cp server.crt /etc/thin_ssl/ssl.crt
    cp server.key /etc/thin_ssl/ssl.key

At this point you will want to add three lines to your Thin Server yml file:

    ssl: true
    ssl_cert_file: /etc/thin_ssl/ssl.crt
    ssl_key_file: /etc/thin_ssl/ssl.key

Restart your thin servers at this point and you should now be able to connect to your server using https://  
Please remember that SSL traffic is on port 443, and you will need to have this port open in your firewall.
</div>