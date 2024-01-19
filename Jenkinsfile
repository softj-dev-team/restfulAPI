pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Pull from Git') {
            steps {
                // Git 리포지토리에서 'main' 브랜치로 pull을 수행합니다...
                script {
                    sh "git pull origin main"
                }
            }
        }
//
//         stage('Install Dependencies') {
//             steps {
//                 sh 'npm install'
//             }
//         }
//         stage('Build') {
//             steps {
//                 try {
//                     sh 'npm run build'
//                 } catch (Exception e) {
//                     currentBuild.result = 'FAILURE' // 빌드 실패 시 설정
//                     error "Build failed: ${e.message}" // 에러 메시지 출력
//                 }
//             }
//         }
//         stage('Test') {
//             steps {
//                 try {
//                     sh 'npm test'
//                 } catch (Exception e) {
//                     currentBuild.result = 'FAILURE' // 테스트 실패 시 설정
//                     error "Tests failed: ${e.message}" // 에러 메시지 출력
//                 }
//             }
//         }
//         stage('Deploy') {
//             steps {
//                 try {
//                     // 노드 서버를 nodemon으로 실행
//                     sh 'npx nodemon index.js'
//                 } catch (Exception e) {
//                     currentBuild.result = 'FAILURE' // 배포 실패 시 설정
//                     error "Deployment failed: ${e.message}" // 에러 메시지 출력
//                 }
//             }
//         }
    }

    post {
        success {
            echo 'Build and deployment successful' // 성공 시 메시지 출력
        }
        failure {
            echo 'Build and deployment failed' // 실패 시 메시지 출력
        }
    }
}
