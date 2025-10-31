*** Settings ***
Documentation     ชุดทดสอบการเรียกดูและค้นหาชีท
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup Test Session
Suite Teardown    Teardown Test Session

*** Test Cases ***
ทดสอบดึงรายการชีททั้งหมดโดยไม่ต้องเข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงรายการชีททั้งหมดในฐานะผู้เยี่ยมชม
    [Tags]    sheets    browse    positive
    ${response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    ${data}=    Set Variable    ${response.json()}
    # ตรวจสอบว่าได้ response ที่ถูกต้อง (อาจเป็น array ว่างถ้าไม่มีชีท)
    Log    ดึงรายการชีทสำเร็จ: ${data}

ทดสอบดึงรายการชีทแนะนำ
    [Documentation]    ทดสอบการดึงรายการชีทแนะนำ
    [Tags]    sheets    featured    positive
    ${response}=    GET With Retry    api    ${SHEETS_FEATURED}    ${None}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการชีทแนะนำสำเร็จ

ทดสอบค้นหาชีทด้วยคำค้น
    [Documentation]    ทดสอบการค้นหาชีทโดยใช้คำค้น (ค้นหาด้วยคำว่า test)
    [Tags]    sheets    search    positive
    ${params}=    Create Dictionary    q=test
    ${response}=    GET With Retry    api    ${SHEETS_SEARCH}    ${None}    ${params}    200
    Should Be Equal As Strings    ${response.status_code}    200

ทดสอบค้นหาชีทตามคณะ
    [Documentation]    ทดสอบการค้นหาชีทโดยกรองตามคณะ
    [Tags]    sheets    search    positive
    ${params}=    Create Dictionary    faculty=${VALID_FACULTY}
    ${response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${params}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ค้นหาชีทตามคณะสำเร็จ

ทดสอบค้นหาชีทตามรหัสวิชา
    [Documentation]    ทดสอบการค้นหาชีทโดยกรองตามรหัสวิชา (ใช้ search parameter)
    [Tags]    sheets    search    positive
    ${params}=    Create Dictionary    search=${VALID_SUBJECT}
    ${response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${params}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ค้นหาชีทตามรหัสวิชาสำเร็จ

ทดสอบค้นหาชีทด้วยตัวกรองหลายรายการ
    [Documentation]    ทดสอบการค้นหาชีทโดยใช้ตัวกรองหลายรายการพร้อมกัน
    [Tags]    sheets    search    positive
    ${params}=    Create Dictionary
    ...    faculty=${VALID_FACULTY}
    ...    term=${VALID_TERM}
    ${response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${params}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ค้นหาชีทด้วยตัวกรองหลายรายการสำเร็จ

ทดสอบดึงรายละเอียดชีทด้วย ID ที่ถูกต้อง
    [Documentation]    ทดสอบการดึงรายละเอียดชีทด้วย ID ที่มีอยู่จริง
    [Tags]    sheets    details    positive
    # ดึงรายการชีทก่อน
    ${list_response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${None}    200
    ${response_data}=    Set Variable    ${list_response.json()}
    # ตรวจสอบว่า response มี sheets array หรือไม่
    ${has_data_key}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${response_data}    data
    Run Keyword If    ${has_data_key}    Test Get First Sheet From Data    ${response_data}[data]
    ...    ELSE    Test Get First Sheet From Array    ${response_data}

ทดสอบดึงรายละเอียดชีทด้วย ID ที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการดึงรายละเอียดชีทด้วย ID ที่ไม่มีอยู่
    [Tags]    sheets    details    negative
    ${response}=    GET With Retry    api    /sheets/99999999    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    404

ทดสอบดึงรายการชีทของฉันโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการเข้าถึงชีทของฉันโดยไม่ได้ login
    [Tags]    sheets    mysheets    negative
    ${response}=    GET With Retry    api    ${SHEETS_MY}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

*** Keywords ***
Test Get First Sheet From Data
    [Arguments]    ${data}
    ${sheets}=    Set Variable    ${data}[sheets]
    ${has_sheets}=    Evaluate    len($sheets) > 0
    Run Keyword If    ${has_sheets}    Test Get Sheet By ID    ${sheets[0]}[id]
    ...    ELSE    Log    ไม่มีชีทในระบบ - ข้ามการทดสอบนี้    level=WARN

Test Get First Sheet From Array
    [Arguments]    ${sheets}
    ${has_sheets}=    Evaluate    len($sheets) > 0
    Run Keyword If    ${has_sheets}    Test Get Sheet By ID    ${sheets[0]}[id]
    ...    ELSE    Log    ไม่มีชีทในระบบ - ข้ามการทดสอบนี้    level=WARN

Test Get Sheet By ID
    [Arguments]    ${sheet_id}
    ${response}=    GET With Retry    api    /sheets/${sheet_id}    ${None}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    ${sheet_data}=    Set Variable    ${response.json()}[data][sheet]
    Should Be Equal As Numbers    ${sheet_data}[id]    ${sheet_id}
    Log    ดึงรายละเอียดชีทสำเร็จ
