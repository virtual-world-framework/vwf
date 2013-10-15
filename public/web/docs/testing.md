Running Tests
===================
-------------------

The Virtual World Framework has tests against the server and some of the core client libraries. This page provides information on how to run the tests on your development machine.

**NOTE:** If you are not changing the core VWF files, you probably don't need to run these tests. See the "Troubleshoting" section of the [Introduction](introduction.html) for info on verifying that your VWF application is working in the browser.

-------------------

### Ruby

The Ruby tests exercise parts of the Ruby server and are run using rake.

~~~
bundle exec rake test
~~~

-------------------

### QUnit (JavaScript)

The QUnit tests exercise some of the front-end JavaScript code. They require you have PhantomJS installed in order to run.

To install PhantomJS, follow the instructions for your platform.

**Linux**

1\. Install PhantomJS using APT-GET or YUM install commands depending on your Linux flavor.

~~~
apt-get install phantomjs or yum instal phantomjs
~~~

2\. Run the tests.

~~~
bundle exec rake client:test
~~~

**Mac**

1\. Install PhantomJS using [Homebrew](http://brew.sh/).

~~~
brew install phantomjs
~~~

2\. Run the tests.

~~~
bundle exec rake client:test
~~~

**Windows**


1\. Visit [PhantomJS Downloads](http://phantomjs.org/download.html) and download the Windows zip file. 

2\. Unzip the file and copy phantomjs.exe to a known location.

3\. Run the tests, specifying the location of phantomjs.exe, like so.

~~~
PHANTOMJS_BIN=/path/to/phantomjs.exe rake client:test
~~~

NOTE: If you have a space in your path, make sure to surround it with quotes 
and escape it with a "\", like so.

~~~
PHANTOMJS_BIN="/space\ path/path/to/phantomjs.exe rake client:test
~~~

-------------------
