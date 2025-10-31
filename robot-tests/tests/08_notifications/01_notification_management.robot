*** Settings ***
Documentation     ชุดทดสอบการจัดการการแจ้งเตือน
Resource          ../../resources/common.robot
Resource          ../../resources/variables.robot
Suite Setup       Setup And Register Test User
Suite Teardown    Teardown Test Session

*** Test Cases ***
ทดสอบดึงการแจ้งเตือนทั้งหมด
    [Documentation]    ทดสอบการดึงรายการการแจ้งเตือนทั้งหมด
    [Tags]    notifications    list    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    # Use retry-capable GET in case of transient 429 or delays
    ${response}=    GET With Retry    api    ${NOTIFICATIONS_LIST}    ${headers}    ${None}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ดึงรายการการแจ้งเตือนสำเร็จ

ทดสอบดึงการแจ้งเตือนโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการดึงการแจ้งเตือนโดยไม่ได้ login
    [Tags]    notifications    list    negative
    ${response}=    GET With Retry    api    ${NOTIFICATIONS_LIST}    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้วโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้วโดยไม่ได้ login
    [Tags]    notifications    read    negative
    ${response}=    PATCH With Retry    api    ${NOTIFICATIONS_LIST}/1/read    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401

ทดสอบทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
    [Documentation]    ทดสอบการทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
    [Tags]    notifications    read    positive
    ${token}=    Login User
    ${headers}=    Get Auth Headers    ${token}
    ${response}=    PATCH With Retry    api    ${NOTIFICATIONS_LIST}/read-all    ${None}    ${headers}    200
    Should Be Equal As Strings    ${response.status_code}    200
    Log    ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้วสำเร็จ

ทดสอบทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้วโดยไม่ได้เข้าสู่ระบบ
    [Documentation]    ทดสอบการทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้วโดยไม่ได้ login
    [Tags]    notifications    read    negative
    ${response}=    PATCH With Retry    api    ${NOTIFICATIONS_LIST}/read-all    ${None}    ${None}    anything
    Should Be Equal As Strings    ${response.status_code}    401
