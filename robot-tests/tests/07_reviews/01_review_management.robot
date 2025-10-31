*** Settings ***
Documentation     ชุดทดสอบการรีวิวและให้คะแนน
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup And Register Test User
Suite Teardown    Teardown Test Session

*** Test Cases ***
ทดสอบดึงรีวิวของชีท
    [Documentation]    ทดสอบการดึงรีวิวทั้งหมดของชีทหนึ่ง
    [Tags]    reviews    get    positive
    # ดึง sheet ID ก่อน
    ${sheets_response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${None}    200
    ${response_data}=    Set Variable    ${sheets_response.json()}
    ${has_data_key}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${response_data}    data
    ${sheets}=    Run Keyword If    ${has_data_key}    Set Variable    ${response_data}[data][sheets]
    ...    ELSE    Set Variable    ${response_data}
    Run Keyword If    ${sheets}    Test Get Reviews For First Sheet    ${sheets}
    ...    ELSE    Log    ไม่มีชีทในระบบ

ทดสอบสร้างรีวิวโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการสร้างรีวิวโดยไม่ได้ login
    [Tags]    reviews    create    negative
    ${data}=    Create Dictionary
    ...    rating=5
    ...    comment=ชีทดีมาก!
    Sleep    2s
    ${response}=    POST With Retry    api    /reviews/1    ${data}    ${None}    anything    10
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบสร้างรีวิวด้วยคะแนนที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการสร้างรีวิวด้วยคะแนนที่ไม่อยู่ในช่วงที่ถูกต้อง
    [Tags]    reviews    create    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary
    ...    rating=10
    ...    comment=คะแนนไม่ถูกต้อง
    Sleep    2s
    ${response}=    POST With Retry    api    /reviews/1    ${data}    ${headers}    anything    10
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบสร้างรีวิวโดยไม่ระบุคะแนน
    [Documentation]    ทดสอบการสร้างรีวิวโดยไม่ส่งคะแนน
    [Tags]    reviews    create    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary    comment=ไม่มีคะแนน
    Sleep    2s
    ${response}=    POST With Retry    api    /reviews/1    ${data}    ${headers}    anything    10
    Should Be Equal As Strings    ${response.status_code}    400

ทดสอบดึงรีวิวของฉันสำหรับชีทหนึ่ง
    [Documentation]    ทดสอบการดึงรีวิวที่ฉันเขียนสำหรับชีทหนึ่ง
    [Tags]    reviews    myreview    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # ลองดึงรีวิว (จะได้ 404 ถ้ายังไม่เคยรีวิว)
    ${response}=    GET With Retry    api    /reviews/1/me    ${headers}    ${None}    anything
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 404
    Log    การตอบสนองรีวิวของฉัน: ${response.status_code}

ทดสอบดึงรีวิวของฉันโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงรีวิวของฉันโดยไม่ได้ login
    [Tags]    reviews    myreview    negative
    ${response}=    GET With Retry    api    /reviews/1/me    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบลบรีวิวโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการลบรีวิวโดยไม่ได้ login
    [Tags]    reviews    delete    negative
    ${response}=    DELETE With Retry    api    /reviews/1    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

*** Keywords ***
Test Get Reviews For First Sheet
    [Arguments]    ${sheets}
    ${first_sheet_id}=    Set Variable    ${sheets[0]}[id]
    ${response}=    GET With Retry    api    /reviews/${first_sheet_id}    ${None}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรีวิวของชีท ${first_sheet_id} สำเร็จ
