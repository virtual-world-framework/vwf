# :DK-BEG: override 'gem install' to enable RubyInstaller DevKit usage
Gem.pre_install do |gem_installer|
  unless gem_installer.spec.extensions.empty?
    unless ENV['PATH'].include?('C:\\Develop\\glge-v0.9\\support\\build\\ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx\\mingw\\bin') then
      Gem.ui.say 'Temporarily enhancing PATH to include DevKit...' if Gem.configuration.verbose
      ENV['PATH'] = 'C:\\Develop\\glge-v0.9\\support\\build\\ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx\\bin;C:\\Develop\\glge-v0.9\\support\\build\\ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx\\mingw\\bin;' + ENV['PATH']
    end
    ENV['RI_DEVKIT'] = 'C:\\Develop\\glge-v0.9\\support\\build\\ruby-devkit-tdm-32-4.5.2-20111229-1559-sfx'
    ENV['CC'] = 'gcc'
    ENV['CXX'] = 'g++'
    ENV['CPP'] = 'cpp'
  end
end
# :DK-END:
