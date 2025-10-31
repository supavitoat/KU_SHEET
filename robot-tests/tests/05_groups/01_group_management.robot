*** Settings ***
Documentation     ชุดทดสอบการซื้อรวมกลุ่ม
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup And Register Test User
Suite Teardown    Teardown Test Session

*** Test Cases ***
ทดสอบดึงรายการกลุ่มทั้งหมดโดยไม่ต้องเข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงรายการกลุ่มทั้งหมดในฐานะผู้เยี่ยมชม
    [Tags]    groups    list    positive
    ${response}=    GET With Retry    api    ${GROUPS_LIST}    ${None}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการกลุ่มสำเร็จ

ทดสอบดึงรายการกลุ่มของฉัน
    [Documentation]    ทดสอบการดึงรายการกลุ่มที่เข้าร่วมอยู่
    [Tags]    groups    mygroups    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${response}=    GET With Retry    api    ${GROUPS_MY}    ${headers}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการกลุ่มของฉันสำเร็จ

ทดสอบดึงรายการกลุ่มของฉันโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการเข้าถึงกลุ่มของฉันโดยไม่ได้ login
    [Tags]    groups    mygroups    negative
    ${response}=    GET With Retry    api    ${GROUPS_MY}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบสร้างกลุ่มด้วยข้อมูลที่ถูกต้อง
    [Documentation]    ทดสอบการสร้างกลุ่มด้วยข้อมูลที่ครบถ้วนและถูกต้อง
    [Tags]    groups    create    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary
    ...    title=กลุ่มศึกษาทดสอบ
    ...    description=กลุ่มทดสอบสำหรับการศึกษา
    ...    capacity=10
    ...    locationName=ห้องสมุด
    ...    startAt=2025-12-31T10:00:00Z
    ...    endAt=2025-12-31T12:00:00Z
    ${response}=    POST With Retry    api    ${GROUPS_CREATE}    ${data}    ${headers}    anything
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 201
    Run Keyword If    ${response.status_code} == 201    Log    สร้างกลุ่มสำเร็จ
    ...    ELSE    Log    การตอบสนองการสร้างกลุ่ม: ${response.status_code}

ทดสอบสร้างกลุ่มโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการสร้างกลุ่มโดยไม่ได้ login
    [Tags]    groups    create    negative
    ${data}=    Create Dictionary
    ...    title=กลุ่มทดสอบ
    ...    description=คำอธิบายทดสอบ
    ...    capacity=10
    ...    locationName=ห้องสมุด
    ...    startAt=2025-12-31T10:00:00Z
    ${response}=    POST With Retry    api    ${GROUPS_CREATE}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบสร้างกลุ่มโดยขาดข้อมูลที่จำเป็น
    [Documentation]    ทดสอบการสร้างกลุ่มโดยไม่ครบข้อมูลที่ต้องใช้
    [Tags]    groups    create    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary    title=กลุ่มทดสอบ
    ${response}=    POST With Retry    api    ${GROUPS_CREATE}    ${data}    ${headers}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบสร้างกลุ่มด้วยจำนวนสมาชิกสูงสุดที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการสร้างกลุ่มด้วย maxMembers ที่ไม่ถูกต้อง
    [Tags]    groups    create    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary
    ...    title=กลุ่มทดสอบ
    ...    description=ทดสอบ
    ...    capacity=0
    ...    locationName=ห้องสมุด
    ...    startAt=2025-12-31T10:00:00Z
    ${response}=    POST With Retry    api    ${GROUPS_CREATE}    ${data}    ${headers}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบดึงรายละเอียดกลุ่มด้วย ID ที่ถูกต้อง
    [Documentation]    ทดสอบการดึงรายละเอียดกลุ่ม
    [Tags]    groups    details    positive
    # ดึงรายการกลุ่มก่อน
    ${list_response}=    GET With Retry    api    ${GROUPS_LIST}    ${None}    ${None}    200
    ${groups}=    Set Variable    ${list_response.json()}[data]
    Run Keyword If    ${groups}    Test Get First Group    ${groups}
    ...    ELSE    Log    ไม่มีกลุ่มในระบบ

ทดสอบดึงรายละเอียดกลุ่มด้วย ID ที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการดึงรายละเอียดกลุ่มด้วย ID ที่ไม่มีอยู่
    [Tags]    groups    details    negative
    ${response}=    GET With Retry    api    /groups/99999999    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    404

ทดสอบเข้าร่วมกลุ่มโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการเข้าร่วมกลุ่มโดยไม่ได้ login
    [Tags]    groups    join    negative
    ${response}=    POST With Retry    api    /groups/1/join    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

*** Keywords ***
Test Get First Group
    [Arguments]    ${groups}
    ${first_group_id}=    Set Variable    ${groups[0]}[id]
    ${response}=    GET With Retry    api    /groups/${first_group_id}    ${None}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Should Be Equal As Strings    ${response.json()}[data][id]    ${first_group_id}
    Log    ดึงรายละเอียดกลุ่มสำเร็จ
