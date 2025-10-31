*** Settings ***
Documentation     ชุดทดสอบการจัดการรายการโปรด
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup And Register Test User
Suite Teardown    Teardown Test Session
Test Setup        Short Cooldown

*** Test Cases ***
ทดสอบดึงรายการโปรดว่างเปล่า
    [Documentation]    ทดสอบการดึงรายการโปรดของผู้ใช้ใหม่ที่ยังไม่มีรายการ
    [Tags]    wishlist    get    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${response}=    GET With Retry    api    ${WISHLIST_GET}    ${headers}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการโปรดสำเร็จ

ทดสอบดึงรายการโปรดโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการเข้าถึงรายการโปรดโดยไม่ได้ login
    [Tags]    wishlist    get    negative
    ${response}=    GET With Retry    api    ${WISHLIST_GET}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบเพิ่มชีทลงรายการโปรดด้วย ID ที่ถูกต้อง
    [Documentation]    ทดสอบการเพิ่มชีทเข้ารายการโปรด
    [Tags]    wishlist    add    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # ดึง sheet ID ก่อน
    ${sheets_response}=    GET With Retry    api    ${SHEETS_LIST}    ${None}    ${None}    200
    ${response_data}=    Set Variable    ${sheets_response.json()}
    ${has_data_key}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${response_data}    data
    ${sheets}=    Run Keyword If    ${has_data_key}    Set Variable    ${response_data}[data][sheets]
    ...    ELSE    Set Variable    ${response_data}
    Run Keyword If    ${sheets}    Test Add First Sheet To Wishlist    ${sheets}    ${headers}
    ...    ELSE    Log    ไม่มีชีทที่สามารถเพิ่มได้

ทดสอบเพิ่มชีทลงรายการโปรดโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการเพิ่มชีทเข้ารายการโปรดโดยไม่ได้ login
    [Tags]    wishlist    add    negative
    ${data}=    Create Dictionary    sheetId=1
    ${response}=    POST With Retry    api    ${WISHLIST_ADD}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบเพิ่มชีทลงรายการโปรดด้วย ID ที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการเพิ่มชีทที่ไม่มีอยู่เข้ารายการโปรด
    [Tags]    wishlist    add    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${data}=    Create Dictionary    sheetId=99999999
    ${response}=    POST With Retry    api    ${WISHLIST_ADD}    ${data}    ${headers}    anything
    Should Be True    ${response.status_code} >= 400

ทดสอบลบชีทออกจากรายการโปรดโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการลบชีทออกจากรายการโปรดโดยไม่ได้ login
    [Tags]    wishlist    remove    negative
    ${response}=    DELETE With Retry    api    ${WISHLIST_REMOVE}/1    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบดึง ID รายการโปรด
    [Documentation]    ทดสอบการดึงเฉพาะ ID ของชีทในรายการโปรด
    [Tags]    wishlist    ids    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    Sleep    2s
    ${response}=    GET With Retry    api    /wishlist/ids    ${headers}    ${None}    200    10
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึง ID รายการโปรดสำเร็จ

*** Keywords ***
Test Add First Sheet To Wishlist
    [Arguments]    ${sheets}    ${headers}
    ${first_sheet_id}=    Set Variable    ${sheets[0]}[id]
    ${data}=    Create Dictionary    sheetId=${first_sheet_id}
    ${response}=    POST With Retry    api    ${WISHLIST_ADD}    ${data}    ${headers}    anything
    # Accept 200/201 on success or 400 when item already exists in wishlist
    Run Keyword If    ${response.status_code} == 400    Log    ชีทนี้อยู่ในรายการโปรดแล้ว (status 400)
    Should Be True    ${response.status_code} == 200 or ${response.status_code} == 201 or ${response.status_code} == 400
    Log    เพิ่มชีทลงรายการโปรดสำเร็จ
