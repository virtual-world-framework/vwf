=== TDM-GCC Compiler Suite for Windows ===
---         GCC 4.4/4.5 Series         ---
***   Standard MinGW 32-bit Edition    ***


This edition of TDM-GCC is an unofficial replacement for the official GCC
binaries distributed by the MinGW project; please note the following caveats:
 * TDM-GCC is not formally affiliated with or endorsed by the MinGW project.
 * No level of support for TDM-GCC is in any way guaranteed, although a best
     effort is made to fix bugs as they are found or forward them to GCC
     Bugzilla.


BUGS:
If you encounter a problem while using a TDM-GCC build that isn't present in a
previous MinGW or TDM release, you are encouraged to submit a helpful bug
report. Please see <http://tdm-gcc.tdragon.net/bugs> for further instructions.


>>>>> INSTALLATION

*** TDM/MinGW Installer ***

Using the TDM/MinGW installer is highly recommended; it can automatically
install TDM-GCC (or the official MinGW GCC) as well as all supplementary base
system packages. The installer uses a standard wizard interface with reasonable
defaults.

*** Manual Installation ***

Do not install TDM-GCC packages on top of a previous working GCC installation of
any kind.

You will need to download and unpack a set of archives. A minimal base set of
archives is required; there are also some additional components that are
optional, adding support for additional programming languages or GCC features.

TDM-GCC provides a ZIP-compressed version and a TAR.LZMA-compressed version of
each archive. Use whichever is easiest.

REQUIRED BASE:
 * gcc-core (gcc-4.5.2-tdm-1-core)
 * binutils (binutils-2.21-3-mingw32-bin)
 * mingwrt (mingwrt-3.18-mingw32-dev, mingwrt-3.18-mingw32-dll)
 * w32api (w32api-3.17-2-mingw32-dev)

OPTIONAL:
 * gcc-c++ (gcc-4.5.2-tdm-1-c++) - C++ support
 * gcc-ada (gcc-4.5.2-tdm-1-ada) - Ada support
 * gcc-fortran (gcc-4.5.2-tdm-1-fortran) - Fortran support
 * gcc-objc (gcc-4.5.2-tdm-1-objc) - Objective-C/C++ support
 * gcc-openmp (gcc-4.5.2-tdm-1-openmp) - OpenMP support
 * mingw32-make (make-3.82-5-mingw32-bin, libintl-0.17-1-mingw32-dll-8,
     libiconv-1.13.1-1-mingw32-dll-2) - GNU make for *-mingw32 GCC
 * gdb (gdb-7.2-1-mingw32-bin, libexpat-2.0.1-1-mingw32-dll-1) - GNU
     source-level debugger, for mingw32
You'll need GDB particularly if you want to use an IDE with debugging support.

Unpack all the archives to an empty directory. You may choose any path, though
it is recommended that you avoid a path with any spaces in the folder names.
Finally, consider adding the bin subdirectory to your Windows PATH environment
variable.


>>>>> USAGE NOTES

*** LTO (Link-Time Optimization) ***

Every TDM-GCC release since 4.5.1 includes support for GCC's Link-Time
Optimizer. As long as GCC's own drivers (gcc, g++, etc.) are used at both
compile-time and link-time, and the "-flto" option is specified at both compile-
time and link-time, link-time optimization will be applied. See
<http://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html> for further details.

*** "Graphite" Loop Transformations ***

Every TDM-GCC release since 4.4.1 includes support for GCC's Graphite loop
transformation infrastructure. Support for these optimizations is currently
optional, and they are not enabled at any of the -O optimization levels. If you
are interested in using them, the relevant options are "-floop-interchange",
"-floop-strip-mine", and "-floop-block", and they are documented at
<http://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html>.

*** DW2 vs. SJLJ unwinding ***

GCC currently supports two methods of stack frame unwinding: Dwarf-2 (DW2) or
SJLJ (setjmp/longjmp). Until recently, only SJLJ has been available for the
Windows platform. This affects you, the end user, primarily in programs that
throw and catch exceptions. Programs which utilize the DW2 unwind method
generally execute more quickly than programs which utilize the SJLJ method,
because the DW2 method incurs no runtime overhead until an exception is thrown.
However, the DW2 method does incur a size penalty on code that must handle
exceptions, and more importantly the DW2 method cannot yet unwind (pass
exceptions) through "foreign" stack frames: stack frames compiled by another
non-DW2-enabled compiler, such as OS DLLs in a Windows callback.

This means that you should in general choose the SJLJ version of the TDM-GCC
builds unless you know you need faster exception-aware programs and can be
certain you will never throw an exception through a foreign stack area.

As distributed, the SJLJ and DW2 packages of TDM-GCC can coexist peacefully
extracted to the same directory (i.e. any files in common are for all intents
and purposes identical), because the driver executables (the ones in the "bin"
directory) are suffixed with "-dw2" for the DW2 build, and the libraries and
other executables hide in another "-dw2" directory in "lib(exec)/gcc/mingw32".
This allows you to use the same single addition to your PATH, and use DW2
exceptions only when you need them by calling "gcc-dw2", etc. If you truly want
DW2 exceptions as the default when calling "gcc" (from Makefiles or configury
systems, for example), you can rename or copy the suffixed executables to their
original names.

*** Exceptions and DLLs ***

[[[ IMPORTANT NOTE:
[[[ TDM-GCC uses a statically-linked libstdc++ by default! To use the libstdc++
[[[ DLL, specify "-shared-libstdc++" on the command line.

With the advent of the GCC 4.5 release series, the mingw32 port finally supports
fully the same method every other platform uses to allow exceptions to propagate
out of shared libraries (DLLs): gcc library DLLs. For any GCC language that
supports exceptions (and DLLs), this method requires the runtime presence of two
additional DLLs: (1) libgcc_s*.dll, which contains common core data, and (2) a
language-specific DLL.

However, TDM-GCC also continues to integrate a versioned shared memory region
for the *static* (non-DLL) runtime libraries, which will still allow you to
throw exceptions between any DLLs or executables that are built with TDM-GCC.
This method incurs a very small execution overhead as compared to the shared
library method, but has the very important benefit of not requiring you to
redistribute extra DLLs with your program.

By default, TDM-GCC will continue to create executables and DLLs that use the
static libraries and do not require you to redistribute further DLLs. If you
would like to use the shared libraries, you should add "-shared-libgcc" to the
command line to use a shared version of libgcc, and additionally ensure that the
shared version of your language-specific runtime library is being used. For C++,
add "-shared-libstdc++".

You cannot use a shared version of libgcc with a static version of a language-
specific runtime. The reverse -- static libgcc with shared language-specific
runtime -- should work fine.

IMPORTANT NOTE:
There has been an update to the license exception clause that permits you to
distribute programs that make use of the GCC runtime libraries without requiring
you to license your programs under the GPLv3. As always, please be familiar with
the terms of GCC's GPLv3 license and exception clauses, and do not redistribute
any portion of GCC, including its runtime DLLs, in any way except as granted by
the license. If you are unclear about which permissions are granted by the
license, please consult a lawyer and/or the Free Software Foundation
(<http://www.fsf.org/>).

A copy of the GPLv3 may be found in the file
COPYING-gcc-tdm.txt, and a copy of the runtime library exception clause may be
found in COPYING.RUNTIME-gcc-tdm.txt. In general, the runtime library exception
clause probably applies to any file found in the "lib" directory or its
subdirectories, and any DLL found in the "bin" directory -- but you should
consult the sources, available for download from the TDM-GCC project site on
SourceForge, if you are unsure.

*** OpenMP and pthreads-w32 ***

TDM-GCC has been built to allow the use of GCC's "-fopenmp" option for
generating parallel code as specified by the OpenMP API. (See
<http://gcc.gnu.org/onlinedocs/libgomp/> for details.) If you want to use
OpenMP in your programs, be sure to install the "openmp" optional package.

The OpenMP support in the TDM-GCC builds has received very little testing; if
you find build or packaging problems, please send a bug report (see BUGS above).

LibGOMP, GCC's implementation of OpenMP, currently only supports the use of the
POSIX Threads (pthreads) api for implementing its threading model. Because the
MinGW project itself doesn't distribute a pthreads implementation, the
"pthreads-win32" library, available from http://sourceware.org/pthreads-win32/,
is included in this distribution. If you aren't familiar with pthreads-win32,
please read the file "pthreads-win32-README" for more information, or the
documentation available at the website referenced above. pthreads-win32 is
distributed under the terms of the LGPL; see "COPYING.lib-gcc-tdm.txt" for
details.

In order to correctly compile code that utilizes OpenMP/libGOMP, you need to add
the "-fopenmp" option at compile time AND link time. By default, this will link
the standard C-cleanup DLL version of pthreads-win32 to your program, which
means that you will need to ensure that the file "pthreadGC2.dll" (included in
the "bin" subdirectory in the openmp package) can be found by your program. If
you plan to distribute a program that relies on pthreads-win32, be sure to
understand and comply with the terms of the LGPL (see COPYING.lib-gcc-tdm.txt).

"libpthread.a" is included in the "lib" subdirectory of the openmp package along
with two other pthreads library files:
 - "libpthreadGC2-static.a" provides a static version of the pthreads-win32
     library, but it requires some additional non-POSIX-compliant startup code
     to be included in your program. See "pthreads-win32-README" for
     details.
 - "libpthreadGCE2.a" provides a version of the pthreads-win32 library with
     a somewhat safer response in the face of unexpected C++ exceptions.
     The creators of the pthreads-win32 library recommend, however, that this
     version not be used, because code written to rely on this is less portable.

*** Warnings and errors ***

GCC 4 represents a significant step forward in optimization capabilities, error
detection, and standards compliance, and this is more true than ever with the
most recent GCC releases. For you, the end user, this will mean that code which
compiled and ran without problems on previous GCC releases will almost certainly
exhibit some warnings and maybe even a few errors.

These meaningful warnings and errors are a very good thing, as they help the
programmer to write safer and more correct code. Unfortunately, there's also a
chance you might encounter incorrect warnings or errors, ICE's (internal
compiler errors, where the compiler makes a mistake and has to bail out), or
even miscompilations (where your code is incorrectly compiled and produces the
wrong result).

If you encounter an ICE while using a TDM-GCC build, feel free to file a bug
report (see BUGS above). With any other unexpected problem, you are urged to
work from the assumption that it stems from user error, and ensure that your
code is correct and standards-compliant.


>>>>> BUGS AND KNOWN ISSUES

 - When GMP is built as a DLL with the *DW2* version of TDM-GCC and with the
     default static libgcc/libstdc++, exceptions apparently cannot propagate
     correctly out of the DLL. This problem does *NOT* appear in the SJLJ
     version.

As these builds are provided on the same basis as the source releases, and the
mingw32 target in GCC tends to receive somewhat less-than-average attention,
some bugs are expected. If you encounter a bug that you are certain is in the
GCC sources (such as an ICE), or that is due to an issue in the building or
packaging process, you are encouraged to report it. Please visit the TDM-GCC
Bugs Page at <http://tdm-gcc.tdragon.net/bugs> for bug reporting instructions.


>>>>> LOCAL FIXES AND CHANGES

 - Includes a patch to make all search paths for headers, libraries and
     helper executables relative to the installation directory of the driver
     executables -- in other words, TDM-GCC is fully relocatable and does not
     search any absolute system paths.
 - Includes a patch backported from GCC 4.6 trunk to fix problems using LTO
     with virtual base classes in C++. (See
     <http://gcc.gnu.org/bugzilla/show_bug.cgi?id=46376>.)
 - Includes a patch to disable the forced generation of code for inline
     functions. This addresses a change in the GCC 4.5 vanilla sources from
     previous releases, which would cause disproportionately large object files
     in programs that expect the old behavior. The patch restores the old
     behavior, until such time as a more suitable response is found. For further
     info, see <http://gcc.gnu.org/bugzilla/show_bug.cgi?id=43601> and
     <http://gcc.gnu.org/viewcvs?view=revision&revision=147799>.
 - Includes a patch to allow libgomp to interoperate correctly with user-
     generated pthreads. See
     <http://sourceforge.net/tracker/?func=detail&aid=2921774&group_id=200665&atid=974439>.
 - Includes a patch to propagate exceptions out of DLLs without the need for
     shared runtime libraries.
 - Includes a patch which corrects backslash usage in header paths and fixes
     path problems when debugging. See
     <http://sourceforge.net/tracker/?func=detail&aid=2145427&group_id=200665&atid=974439>.
 - Includes a patch to keep GCC from erroneously using the CWD as the
     installation directory.
 - Configured with "--enable-fully-dynamic-string", which fixes a bug when
     passing empty std::string objects between DLLs and EXEs.
 - Includes a patch which reintegrates the code from libgcc_eh.a into libgcc.a
     and the libgcc DLL. As long as the shared memory region is used to handle
     exceptions in the static runtimes, this library is unnecessary, and it
     causes multiple definition errors for the symbols in it because it hasn't
     been added to binutils' exception libraries yet.
 - Includes a patch to re-enable large file support for C++ fstreams (LFS
     detection fails because there is no definition for struct stat64 in
     mingw-runtime).

[The following patches are only necessary for the 4.4 series and have been
applied in the 4.5 sources]

 - Includes a patch to disable the swprintf and vswprintf decls in <cwchar> when
     __STRICT_ANSI__ is defined (this was causing errors when -std=c++0x was
     used).


>>>>> SOURCE CODE

The source code for the TDM-GCC binary releases is available from the TDM-GCC
download page on SourceForge: <http://sourceforge.net/projects/tdm-gcc/files/>.
(The most up-to-date link to the download site will always be available at
<http://tdm-gcc.tdragon.net/>.)

The source is distributed in the form of the original ("vanilla") separate
source packages as downloaded, plus an additional "TDM Sources" package. The TDM
Sources package includes unified diffs of any changes made to the vanilla
sources, as well as the set of scripts used to build the binary releases.


>>>>> LICENSE

The TDM-GCC core and language packages in this edition contain binary
distributions constituting a work based on GCC, CLooG, PPL, MPC, libiconv, GMP,
and MPFR. GCC itself, CLooG, and PPL are each licensed under the GPLv3; for
further details, see "COPYING3-gcc-tdm.txt". MPC, libiconv, GMP, and MPFR are
each licensed under the LGPL, a somewhat more permissive version of the GPL; see
"COPYING3.LIB-gcc-tdm.txt". Additionally, GCC's runtime libraries are licensed
with an additional exception clause; see "COPYING.RUNTIME-gcc-tdm.txt".

The OpenMP support package provides binary and source files based on GCC's
libgomp, which is licensed under the GPLv3 with an additional exception (see
"COPYING3-gcc-tdm.txt" and "COPYING.RUNTIME-gcc-tdm.txt"), and on pthreads-w32,
which is licensed under the LGPL (see "COPYING3.LIB-gcc-tdm.txt").

The TDM-GCC distribution is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by the Free
Software Foundation; either version 3 of the License, or (at your option) any
later version.

TDM-GCC is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.
