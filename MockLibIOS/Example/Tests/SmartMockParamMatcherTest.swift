//
//  SmartMockParamMatcherTest.swift
//  SmartMockLib Tests
//
//  Utility test: parameter matching cases
//

import UIKit
import XCTest
@testable import SmartMockLib

class SmartMockParamMatcherTest: XCTestCase {
    
    func testParamEquals() {
        XCTAssertTrue(SmartMockParamMatcher.paramEquals("username", haveParam: "username"))
        XCTAssertFalse(SmartMockParamMatcher.paramEquals("username", haveParam: "username10"))
        XCTAssertTrue(SmartMockParamMatcher.paramEquals("*name", haveParam: "username"))
        XCTAssertFalse(SmartMockParamMatcher.paramEquals("*not", haveParam: "username"))
        XCTAssertTrue(SmartMockParamMatcher.paramEquals("*@*", haveParam: "user@mail"))
        XCTAssertTrue(SmartMockParamMatcher.paramEquals("user??*@*.*", haveParam: "user10ex@mail.com"))
        XCTAssertFalse(SmartMockParamMatcher.paramEquals("user??*@*.*", haveParam: "user4@mail.com"))
        XCTAssertTrue(SmartMockParamMatcher.paramEquals("user??*@*.*", haveParam: "user42@mail.com"))
    }
    
    func testDeepEquals() {
        XCTAssertTrue(SmartMockParamMatcher.deepEquals(
            [ "username": "username" as AnyObject ],
            haveDictionary: [ "username": "username" as AnyObject, "extra": "value" as AnyObject ]
        ))
        XCTAssertTrue(SmartMockParamMatcher.deepEquals(
            [ "username": "username" as AnyObject, "info": [ "name": "*", "role": "admin" ] as AnyObject ],
            haveDictionary: [ "username": "username" as AnyObject, "info": [ "name": "test", "role": "admin" ] as AnyObject ]
        ))
        XCTAssertFalse(SmartMockParamMatcher.deepEquals(
            [ "username": "username" as AnyObject, "info": [ "name": "*", "role": "admin" ] as AnyObject ],
            haveDictionary: [ "username": "username" as AnyObject, "info": [ "role": "admin" ] as AnyObject ]
        ))
    }
    
}
