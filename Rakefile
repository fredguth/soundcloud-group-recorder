

task :build do
  if release?
    cmd = "coffee --bare --lint --print --compile  src/sdk.coffee"
    cmd << "| closure-compiler"
    cmd << replace_client_credentials_pipe
    cmd << " > #{build_dir}/sdk.js"
    sh cmd
  else
    sh coffee_script_cmd
  end
end

task :watch do
  sh "fs-watch src 'echo && echo Rebuilding... && rake build'"
end

task :clean do
  sh "rm -rf #{build_dir}"
end

task :test do
  sh "open test/test.html"
end

task :build_examples do
  sh "mkdir -p #{build_dir}/examples"
  sh example_build_cmd
end



def compress_cmd(from, to)
  "closure-compiler --js #{from} > #{to}"
end


def build_dir
  "build/#{target}"
end

def target
  ENV["TARGET"] || "development"
end

def release?
  target == "release"
end

def replace_client_credentials_pipe
  # connect.dev on sc.com: 694f15bbffd7ae8e6e399f49dd228725
  # connect.dev on sc.dev: f7d8c67ee9db444f6c66e50685611fed
  # connect.com on sc.com: c202b469a633a7a5b15c9e10b5272b78
  %{| sed -e 's/soundcloud.dev/soundcloud.com/g' | sed -e 's/f7d8c67ee9db444f6c66e50685611fed/c202b469a633a7a5b15c9e10b5272b78/' }
end


def coffee_script_cmd(watch=false)
  "coffee --bare --lint -o #{build_dir} --#{watch ? "watch" : "compile"}  src/sdk.coffee"
end