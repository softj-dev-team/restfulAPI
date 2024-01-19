pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                // 노드 서버를 nodemon으로 실행
                sh 'npx nodemon index.js'
            }
        }
    }

    post {
        success {
            // 배포가 성공하면 추가 작업 수행 가능
        }
    }
}
