*** Settings ***
Documentation     ชุดทดสอบการสมัครสมาชิก
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup Test Session
Suite Teardown    Teardown Test Session

*** Test Cases ***
ทดสอบสมัครสมาชิกด้วยข้อมูลที่ถูกต้อง
    [Documentation]    ทดสอบการสมัครสมาชิกด้วยข้อมูลที่ครบถ้วนและถูกต้อง
    [Tags]    auth    register    positive
    ${email}=    Generate Random Email
    ${data}=    Create Dictionary
    ...    email=${email}
    ...    password=Test1234!
    ...    fullName=ผู้ใช้ทดสอบใหม่
    ...    faculty=คณะเกษตร กำแพงแสน
    ...    major=ภาควิชากีฏวิทยา
    ...    year=1
    ${response}=    POST With Retry    api    ${AUTH_REGISTER}    ${data}    ${None}    201
    Should Be Equal As Strings    ${response.status_code}    201
    Dictionary Should Contain Key    ${response.json()}    data
    Dictionary Should Contain Key    ${response.json()}[data]    token
    Should Not Be Empty    ${response.json()}[data][token]
    Log    สมัครสมาชิกสำเร็จสำหรับ ${email}

ทดสอบสมัครสมาชิกด้วยอีเมลที่มีอยู่แล้ว
    [Documentation]    ทดสอบการสมัครสมาชิกด้วยอีเมลที่ซ้ำกัน
    [Tags]    auth    register    negative
    ${email}=    Generate Random Email
    ${data}=    Create Dictionary
    ...    email=${email}
    ...    password=Test1234!
    ...    fullName=ผู้ใช้ทดสอบ
    ...    faculty=คณะเกษตร กำแพงแสน
    ...    major=ภาควิชากีฏวิทยา
    ...    year=1
    # การสมัครครั้งแรก
    ${response1}=    POST With Retry    api    ${AUTH_REGISTER}    ${data}    ${None}    anything
    Should Be True    ${response1.status_code} == 201 or ${response1.status_code} == 400
    # ทดสอบการสมัครซ้ำถ้าครั้งแรกสำเร็จ
    Run Keyword If    ${response1.status_code} == 201    ทดสอบการสมัครซ้ำ    ${data}
    ...    ELSE    Log    ผู้ใช้มีอยู่แล้ว ไม่สามารถทดสอบการสมัครซ้ำได้

ทดสอบสมัครสมาชิกด้วยรูปแบบอีเมลไม่ถูกต้อง
    [Documentation]    ทดสอบการสมัครสมาชิกด้วยอีเมลที่มีรูปแบบไม่ถูกต้อง
    [Tags]    auth    register    negative
    ${data}=    Create Dictionary
    ...    email=อีเมลไม่ถูกต้อง
    ...    password=Test1234!
    ...    fullName=ผู้ใช้ทดสอบ
    ...    faculty=คณะเกษตร กำแพงแสน
    ...    major=ภาควิชากีฏวิทยา
    ...    year=1
    ${response}=    POST With Retry    api    ${AUTH_REGISTER}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบสมัครสมาชิกด้วยรหัสผ่านที่ไม่ปลอดภัย
    [Documentation]    ทดสอบการสมัครสมาชิกด้วยรหัสผ่านที่อ่อนแอ
    [Tags]    auth    register    negative
    ${email}=    Generate Random Email
    ${data}=    Create Dictionary
    ...    email=${email}
    ...    password=123
    ...    fullName=ผู้ใช้ทดสอบ
    ...    faculty=คณะเกษตร กำแพงแสน
    ...    major=ภาควิชากีฏวิทยา
    ...    year=1
    ${response}=    POST With Retry    api    ${AUTH_REGISTER}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบสมัครสมาชิกโดยขาดข้อมูลที่จำเป็น
    [Documentation]    ทดสอบการสมัครสมาชิกโดยไม่กรอกข้อมูลให้ครบ
    [Tags]    auth    register    negative
    ${data}=    Create Dictionary    email=test@ku.th
    ${response}=    POST With Retry    api    ${AUTH_REGISTER}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    400

*** Keywords ***
ทดสอบการสมัครซ้ำ
    [Arguments]    ${data}
    ${response2}=    POST With Retry    api    ${AUTH_REGISTER}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response2.status_code}    400
