# 시스템 설계 요구사항

- 데이터베이스 경로를 $HOME/.matrix/가 아닌 사용자별 애플리케이션 데이터 디렉토리에 저장하도록 변경합니다.
- $HOME/.matrix/ 하위에는 matrix 이름으로 개별 폴더가 생성됩니다. 해당 경로는 matrix 각자의 작업 경로가 됩니다.
- 데이터베이스에 저장되는 것은 메타데이터이고 matrix 경로에 추가되는 것들은 에이전트끼리 상호 교류가 가능한 형태로 저장이 됩니다. json이 될 수도 있고 md 파일이 될 수도 있습니다.
- 생성된 개별 matrix를 앞으로 matrix space라고 부르겠습니다. 시스템 상으론 여전히 Matrix입니다. 사용자가 matrix space를 생성시에 matrix space 폴더가 생성되고 init을 진행합니다. 그러면 Matrix에 필요한 context 정보를 담은 MATRIX.md 를 생성합니다. 해당 MATRIX.md 파일에는 포함된 각각의 저장소에 대한 정보와 각각의 저장소간의 관계를 정의합니다.
