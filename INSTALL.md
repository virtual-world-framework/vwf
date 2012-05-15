Installing VirtualWorldFramework (on Windows)
-
After downloading and extracting the VWF.zip file:

1. Download and install RubyInstaller for Windows:  http://rubyinstaller.org/ During installation make sure to check the option to add Ruby executables to your PATH.
    Note: 1.9.3-p194 has a known segmentation fault bug  (1.9.3-p125 is known to work).

2. Download RubyGems from http://rubyforge.org/frs/?group_id=126 and extract to any directory.

3. Navigate to the extracted RubyGems folder and launch setup.rb. A command window should appear and display a success message.

4. Download and extract the Ruby Development Kit (available at http://rubyinstaller.org/downloads/ or https://github.com/oneclick/rubyinstaller/downloads). 

5. Install the Ruby Development Kit:
    Navigate to the extracted folder within the command prompt and run the following commands:
    - ruby dk.rb init
    - ruby dk.rb install
    - gem install json

6. Navigate back to your VWF directory and run the following commands:
    - gem install bundler
    - bundle install --binstubs

7. From the VWF directory, start the server using thin start –R config.ru

8. The server runs on port 3000 by default. Begin a demo (e.g. Cesium) by connecting to http://localhost:3000/cesium using a WebGL-enabled browser. Once connected, the URL will be appended with a series of letters and numbers. To start a synchronized session, open this URL in another browser window.