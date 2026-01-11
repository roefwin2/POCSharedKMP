package org.shared.kmp

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform