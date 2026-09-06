Steps for Jenkins Docker integration project :
1. Code + Dockerfile (get the code form git repo)
2. Code Scan : CQA (Code Quality Analysis) ---> Sonar 
3. Build : Maven (mvn clean package) (cp -r target Docker-app)
4. Artifact : Nexus
5. Dockerfiles ---> Build ---> image ( docker build -t appimage Docker-app) && (docker build -t dbimage Docker-db)
6. Image Scan -----> Trivy (trivy image appimage) && ( trivy image dbimage)
7. Registry ---> Push
    a. docker tag dbimage shaikmustafa/manual:db
    b. docker tag appimage shaikmustafa/manual:app
    c. docker push shaikmustafa/manual:db
    d. docker push shaikmustafa/manual:app
8. Deploy ---> Pre-Prod & Prod
9. Post Build Actions ---> Pipeline status


Requirements : 

EC2 Machines : 
One Manager Server -> managers the worker servers (m7i-flex.large) -> requires larger instance size.
Two Worker Servers -> runs the applications in containers inside the servers (t3.micro / more is fine)
Nexus Server -> Actrifactory (To store the war files) 
Jenkins Server -> To trigger the Pipeline
Docker Hub Account -> to Push the images

Containers :
Create Sonarqube container in Manager server 
docker run -d --name sonar -p 9000:9000 sonarqube:lts-community -> creating sonar container in manager server.
Login in the sonar server and create a workspace and create a key documentation will be provided in the UI.

In Jenkins Server 
Server a manager Node at the begining og the project.
Add pem.key and add credentails at every stage when every required.
add plugins:
1. Pipeline Stage View
2. Docker pipeline
3. sonarqube
add tools :
maven
git

Dependencies :
Install jenkins in Jenkins Server
Install Git, Docker, Maven, Trivy in Manager Server
Install Nexus in Nexus Server
================================================ Maven Installation Comands ========================================================
wget https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.tar.gz
tar -zxvf apache-maven-3.9.16-bin.tar.gz
mv apache-maven-3.9.16 /opt/maven
cd /opt/
export M2_HOME=/opt/maven
export PATH=$M2_HOME/bin:$PATH
mvn -v
yum install java-21-amazon-corretto -y
mvn -v
======================================================================================================================================

================================================ Install trivy ==========================================================
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin
=========================================================================================================================
================================================ Nexus Install ========================================================
wget https://download.sonatype.com/nexus/3/nexus-3.92.2-01-linux-x86_64.tar.gz
tar -zxvf nexus-3.92.2-01-linux-x86_64.tar.gz
useradd nexus
 chown nexus:nexus nexus-3.92.2-01 sonatype-work/ -R
su - nexus
cd /opt
cd nexus-3.92.2-01/bin/
./nexus start
========================================================================================================================
================================================ Jenkins Install ========================================================
yum install java-21-amazon-corretto -y
sudo wget -O /etc/yum.repos.d/jenkins.repo     https://pkg.jenkins.io/rpm-stable/jenkins.repo
yum install jenkins -y
systemctl start jenkins
systemctl status jenkins
===========================================================================================================================

================================================ Docker Install ========================================================
yum install docker -y && systemctl start docker
========================================================================================================================

================================================ Git Install ========================================================
yum install git -y
yum install tree -y -> to see folder structure
=====================================================================================================================
