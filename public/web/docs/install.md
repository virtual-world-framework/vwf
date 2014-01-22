<div id="install" class="well" markdown="1">
User and App Developer Installation Instructions
==========================
--------------------------

### Windows Installation

To install the windows version of Virtual World Framework, please download the [Latest VWF Installation Package for Windows](http://download.virtualworldframework.com/files/VWF_Windows_Install.exe) and execute the installation file.

--------------------------

### Mac OS X / Linux Installation

NOTE: On Mac OS X, please make sure you have [Xcode Command Line Tools](https://developer.apple.com/xcode/) installed prior to executing the script.

To install the Mac/Linux version of Virtual World Framework, please execute the following command at your terminal/shell prompt:

    $ curl -kL http://get.virtual.wf  | sh

</div>

<div id="advancedInstall" class="well" markdown="1">
Core Developer Installation Instructions
==========================
--------------------------

These instructions are only required if you are going to be developing VWF core functionality.  If you are going to be developing VWF Applications on top of the framework, please follow the instructions above.

The VWF source code may be forked from [github](https://github.com/virtual-world-framework/vwf) at any time.

--------------------------
<div class="well" markdown="1">
### Ubuntu/Debian Automatic Installation

Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_debian.sh | bash -x
</div>
<div class="well" markdown="1">
### Red Hat Enterprise Linux Automatic Installation

Perform the following shell command at a user shell prompt:

	sudo curl https://raw.github.com/virtual-world-framework/vwf/master/support/build/Scripts/build_redhat.sh | bash -x
</div>
<div class="well" markdown="1">
### Manual Installation on Linux
 
 
### RubyGems

Ensure RubyGems is installed (for Debian/Ubuntu). 

	sudo apt-get update
	sudo apt-get install ruby1.9.1 ruby1.9.1-dev \ rubygems1.9.1 irb1.9.1 ri1.9.1 rdoc1.9.1 \ build-essential libopenssl-ruby1.9.1 libssl-dev zlib1g-dev
	sudo update-alternatives --install /usr/bin/ruby ruby /usr/bin/ruby1.9.1 400 \
         --slave   /usr/share/man/man1/ruby.1.gz ruby.1.gz \
                        /usr/share/man/man1/ruby1.9.1.1.gz \
        --slave   /usr/bin/ri ri /usr/bin/ri1.9.1 \
        --slave   /usr/bin/irb irb /usr/bin/irb1.9.1 \
        --slave   /usr/bin/rdoc rdoc /usr/bin/rdoc1.9.1
	sudo update-alternatives --config ruby
	sudo update-alternatives --config gem	

Now try 

	ruby --version

and you should get the 1.9.# baseline for ruby reported back.	
	
Or (for Red Hat/Fedora)

	yum install ruby rubygems

Or (for OSX with Homebrew)

Make sure you have the [Command Line Tools for XCode](https://developer.apple.com/downloads/index.action) installed.
	
	ruby -e "$(curl -fsSkL raw.github.com/mxcl/homebrew/go)"
	brew install automake

The script explains what it will do and then pauses before it does it
	
	\curl -L https://get.rvm.io | bash -s stable --ruby
	source ~/.rvm/scripts/rvm

This installs RVM which is a version manager for Ruby.
	
	rvm install 1.9.3-head
	rvm use ruby-1.9.3-head
	rvm rubygems current
	This adds Ruby 1.9.3 to your machine and sets 1.9.3 as the default Ruby version.

	brew install git
	This installs git if you do not have it already on your machine.

### Download Virtual World Framework

Download the contents of the GitHub Master VWF Baseline to your local directory:

	sudo git clone http://www.github.com/virtual-world-framework/vwf --recursive

### Install the Gems

Launch a terminal window and cd to your VWF development directory:

	cd vwf/

Then enter these commands:

	sudo gem install rubygems-update
	sudo update_rubygems 
	sudo gem install bundler

Now you can install the RubyGems to the system (as root):

	sudo bundle install

### Build the Server
This command will compile and setup the server baseline.

    sudo bundle exec rake 

### Launch the Server
This command launches Ruby's Thin web server to start serving your VWF applications.

	sudo bundle exec thin start

### Connect

The server runs on port 3000 in development mode by default. Use Google Chrome to view the website.
</div>
</div>

<div class="well" markdown="1">
NodeJS Core Developer Installation
==========================
--------------------------

Virtual World Framework is capable of running on top of NodeJS as an alternative to Ruby Thin server (NodeJS will be our default supported server framework in the near future).  The following steps will allow you to install NodeJS web server if you would like to utilize this server framework now as a VWF core developer.


### Installation Steps
1. Install Node.js for your specific environment [http://www.nodejs.org](http://www.nodejs.org).

2. You should already have a baseline on your local machine by following the [Core Developer Installation Instructions](http://localhost:3000/web/documentation.html#advancedInstall)

3. Launch a terminal/command prompt window and cd to your VWF application directory.

    cd Path\To\YourApp

4. Run the vwf command to start the Node JS server.

    vwf

</div>

<div class="well" markdown="1">
Configuring HTTPS/SSL Traffic
==========================
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