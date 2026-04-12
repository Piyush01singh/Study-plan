# StudyFlow - Smart Study Planner

StudyFlow is a responsive web-based study planner that helps students manage subjects, track tasks, schedule study sessions, and monitor progress from a single dashboard.

## Features

- Dashboard overview for subjects, tasks, and study hours
- Subject management with priority levels and custom colors
- Task tracking with deadlines and filters
- Study session scheduling with time slots
- Progress analytics and weekly statistics
- Theme toggle for light and dark modes
- Local storage support with no login required
- Data export and reset options

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Nginx
- Docker
- AWS EC2

## Project Structure

```text
.
|-- Dockerfile
|-- nginx.conf
|-- index.html
|-- styles.css
|-- script.js
`-- README.md
```

## Local Development

Open `index.html` directly in your browser, or run the Docker container locally:

```bash
docker build -t studyflow:latest .
docker run -d -p 8080:80 --name studyflow-container studyflow:latest
```

Then visit `http://localhost:8080`.

## Deployment Commands

This project is containerized with Docker and served through Nginx. These are the typical commands used to deploy it on an AWS EC2 Ubuntu instance and make it accessible through the instance public IP.

### 1. SSH into the EC2 instance

```bash
ssh -i "/path/to/your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

### 2. Update the application code

If Git is configured on the server:

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
git pull origin main
```

If the repository already exists on the server:

```bash
cd <your-repo-name>
git fetch origin
git pull origin main
```

### 3. Build the Docker image

```bash
sudo docker build -t studyflow:latest .
```

### 4. Stop and remove the existing container

```bash
sudo docker stop studyflow-container
sudo docker rm studyflow-container
```

### 5. Run the Docker container

```bash
sudo docker run -d -p 80:80 --name studyflow-container studyflow:latest
```

After this, the application will be available at:

```text
http://<EC2_PUBLIC_IP>
```

## Optional Docker Hub Commands

If you want to publish the image to Docker Hub:

```bash
docker login
docker build -t <dockerhub-username>/studyflow:latest .
docker push <dockerhub-username>/studyflow:latest
```

## EC2 Setup Notes

Before deployment, ensure the EC2 instance is prepared:

- Install Docker on the instance
- Allow inbound traffic on port `80` in the security group
- Keep SSH port `22` open only for your IP or a limited CIDR range
- Use Ubuntu or another Linux image with Docker support

Example Docker installation on Ubuntu:

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

## Submission Checklist

For your assignment submission, include:

- The working public link: `http://<EC2_PUBLIC_IP>`
- Screenshots of the running application in the browser
- Screenshot of the EC2 instance details or terminal deployment
- The deployment commands used
- The GitHub repository link

You can also add the live URL in the GitHub repository description section.
