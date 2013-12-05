DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CWD=$(pwd)
echo "Script file Directory is '$DIR'"
echo "Working Directory is '$CWD'"
echo "Number of Directories depth is '$NUMDIRS'"
cd $DIR 
tar -cvf VWF_linux_stable_latest.tar --no-recursion ./*  --exclude-vcs 
tar -rvf VWF_linux_stable_latest.tar --no-recursion ./public/* --exclude-vcs 
tar -rvf VWF_linux_stable_latest.tar ./lib/* ./support/* --exclude-vcs
gzip -f -9 VWF_linux_stable_latest.tar 
rm -rf VWF_linux_stable_latest.tar
if [ $CWD != $DIR ]; then
   mv -vf VWF_linux_stable_latest.tar.gz $CWD
fi
