*** Settings ***
Documentation     ชุดทดสอบการจัดการคำสั่งซื้อ
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup And Register Test User
Suite Teardown    Teardown Test Session
Test Setup        Short Cooldown

*** Test Cases ***
ทดสอบดึงรายการคำสั่งซื้อของผู้ใช้
    [Documentation]    ทดสอบการดึงประวัติคำสั่งซื้อของผู้ใช้
    [Tags]    orders    list    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    Sleep    2s
    # Use retry-capable keyword with higher max_retries to handle stricter rate-limits during local runs
    ${response}=    GET With Retry    api    ${ORDERS_LIST}    ${headers}    ${None}    200    10
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการคำสั่งซื้อของผู้ใช้สำเร็จ

ทดสอบดึงรายการคำสั่งซื้อโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงรายการคำสั่งซื้อโดยไม่ได้ login
    [Tags]    orders    list    negative
    ${response}=    GET With Retry    api    ${ORDERS_LIST}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบดึงรายการชีทที่ซื้อแล้ว
    [Documentation]    ทดสอบการดึงรายการชีทที่ซื้อแล้วของผู้ใช้
    [Tags]    orders    purchased    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    Sleep    2s
    ${response}=    GET With Retry    api    ${ORDERS_PURCHASED}    ${headers}    ${None}    200    10
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการชีทที่ซื้อแล้วสำเร็จ

ทดสอบดึงสถิติคำสั่งซื้อ
    [Documentation]    ทดสอบการดึงสถิติคำสั่งซื้อของผู้ใช้
    [Tags]    orders    stats    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    Sleep    1s
    ${response}=    GET With Retry    api    ${ORDERS_STATS}    ${headers}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Should Not Be Empty    ${response.json()}
    Log    ดึงสถิติคำสั่งซื้อสำเร็จ

ทดสอบดึงสถิติคำสั่งซื้อโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงสถิติคำสั่งซื้อโดยไม่ได้ login
    [Tags]    orders    stats    negative
    ${response}=    GET With Retry    api    ${ORDERS_STATS}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบสร้างคำสั่งซื้อด้วย ID ชีทที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการสร้างคำสั่งซื้อด้วยชีทที่ไม่มีอยู่
    [Tags]    orders    create    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${item}=    Create Dictionary    sheetId=99999999    quantity=1
    ${items}=    Create List    ${item}
    ${data}=    Create Dictionary    items=${items}
    Sleep    1s
    ${response}=    POST With Retry    api    ${ORDERS_CREATE}    ${data}    ${headers}    anything
    # Expect a client/server error when sheet id is invalid
    Should Be True    ${response.status_code} >= 400

ทดสอบสร้างคำสั่งซื้อโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการสร้างคำสั่งซื้อโดยไม่ได้ login
    [Tags]    orders    create    negative
    ${item}=    Create Dictionary    sheetId=1    quantity=1
    ${items}=    Create List    ${item}
    ${data}=    Create Dictionary    items=${items}
    Sleep    1s
    ${response}=    POST With Retry    api    ${ORDERS_CREATE}    ${data}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบดึงรายละเอียดคำสั่งซื้อด้วย ID ที่ไม่ถูกต้อง
    [Documentation]    ทดสอบการดึงรายละเอียดคำสั่งซื้อด้วย ID ที่ไม่มีอยู่
    [Tags]    orders    details    negative
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    Sleep    1s
    ${response}=    GET With Retry    api    /orders/99999999    ${headers}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    404
