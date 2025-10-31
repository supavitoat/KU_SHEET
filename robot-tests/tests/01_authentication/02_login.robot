*** Settings ***
Documentation     ชุดทดสอบการเข้าสู่ระบบและจัดการบัญชีผู้ใช้
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup Test Session
Suite Teardown    Teardown Test Session
Test Setup        Register Test User

*** Test Cases ***
ทดสอบเข้าสู่ระบบด้วยข้อมูลที่ถูกต้อง
    [Documentation]    ทดสอบการเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ถูกต้อง
    [Tags]    auth    login    positive
    ${data}=    Create Dictionary    email=${TEST_EMAIL}    password=${TEST_PASSWORD}
    # Use POST With Retry so intermittent 429 won't fail the test immediately
    ${response}=    POST With Retry    api    ${AUTH_LOGIN}    ${data}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Dictionary Should Contain Key    ${response.json()}    data
    Dictionary Should Contain Key    ${response.json()}[data]    token
    Should Not Be Empty    ${response.json()}[data][token]
    Should Be Equal As Strings    ${response.json()}[data][user][email]    ${TEST_EMAIL}
    Log    เข้าสู่ระบบสำเร็จ

ทดสอบเข้าสู่ระบบด้วยอีเมลที่ไม่มีในระบบ
    [Documentation]    ทดสอบการเข้าสู่ระบบด้วยอีเมลที่ไม่มีอยู่ในฐานข้อมูล
    [Tags]    auth    login    negative
    ${data}=    Create Dictionary    email=nonexistent@ku.th    password=Test1234!
    ${response}=    POST With Retry    api    ${AUTH_LOGIN}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบเข้าสู่ระบบด้วยรหัสผ่านที่ผิด
    [Documentation]    ทดสอบการเข้าสู่ระบบด้วยรหัสผ่านที่ไม่ถูกต้อง
    [Tags]    auth    login    negative
    ${data}=    Create Dictionary    email=${TEST_EMAIL}    password=WrongPassword123!
    ${response}=    POST With Retry    api    ${AUTH_LOGIN}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบเข้าสู่ระบบโดยไม่ระบุอีเมล
    [Documentation]    ทดสอบการเข้าสู่ระบบโดยไม่ส่งข้อมูลอีเมล
    [Tags]    auth    login    negative
    ${data}=    Create Dictionary    password=${TEST_PASSWORD}
    ${response}=    POST With Retry    api    ${AUTH_LOGIN}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบเข้าสู่ระบบโดยไม่ระบุรหัสผ่าน
    [Documentation]    ทดสอบการเข้าสู่ระบบโดยไม่ส่งข้อมูลรหัสผ่าน
    [Tags]    auth    login    negative
    ${data}=    Create Dictionary    email=${TEST_EMAIL}
    ${response}=    POST With Retry    api    ${AUTH_LOGIN}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบดึงข้อมูลโปรไฟล์หลังเข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงข้อมูลผู้ใช้ด้วย token ที่ถูกต้อง
    [Tags]    auth    profile    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # Use GET With Retry in case of transient 429 from the auth rate-limiter
    ${response}=    GET With Retry    api    ${AUTH_ME}    ${headers}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Dictionary Should Contain Key    ${response.json()}    data
    Dictionary Should Contain Key    ${response.json()}[data]    user
    Should Be Equal As Strings    ${response.json()}[data][user][email]    ${TEST_EMAIL}

ทดสอบดึงข้อมูลโปรไฟล์โดยไม่มี Token
    [Documentation]    ทดสอบการดึงข้อมูลผู้ใช้โดยไม่ส่ง authorization token
    [Tags]    auth    profile    negative
    ${response}=    GET With Retry    api    ${AUTH_ME}    expected_status=anything
    Should Be Equal As Strings    ${response.status_code}    401
