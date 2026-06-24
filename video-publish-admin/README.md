**服务器命令**

cd /opt/video-publish-admin

nohup java -jar video-publish-admin.jar > app.log 2>&1 &

tail -f app.log
