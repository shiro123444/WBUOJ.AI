import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from '@heroui/react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { AnimatedLogo } from '../ui/AnimatedLogo'
import {
  SunIcon,
  MoonIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const navLinks = [
  { to: '/problems', label: '题库' },
  { to: '/submissions', label: '提交记录' },
  { to: '/contests', label: '比赛' },
  { to: '/leaderboard', label: '排行榜' },
  { to: '/solutions', label: '题解' },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMenuOpen(false)
  }

  const isActiveLink = (path: string) => location.pathname === path

  return (
    <HeroNavbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800"
      maxWidth="xl"
      position="sticky"
    >
      {/* Mobile menu toggle */}
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
        />
      </NavbarContent>

      {/* Brand - centered on mobile */}
      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <Link to="/" className="flex items-center gap-2">
            <AnimatedLogo />
            <span className="text-lg font-light tracking-wider text-gray-800 dark:text-gray-100">
              AI CLUB OJ
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Brand - left on desktop */}
      <NavbarContent className="hidden sm:flex gap-4" justify="start">
        <NavbarBrand>
          <Link to="/" className="flex items-center gap-3 group">
            <AnimatedLogo />
            <span className="text-xl font-light tracking-wider text-gray-800 dark:text-gray-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              AI CLUB OJ
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop navigation links */}
      <NavbarContent className="hidden sm:flex gap-1" justify="center">
        {navLinks.map((link) => (
          <NavbarItem key={link.to} isActive={isActiveLink(link.to)}>
            <Link
              to={link.to}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActiveLink(link.to)
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* Right side - theme toggle and auth */}
      <NavbarContent justify="end">
        {/* Theme toggle */}
        <NavbarItem>
          <Button
            isIconOnly
            variant="light"
            onPress={toggleTheme}
            aria-label="切换主题"
            className="text-gray-600 dark:text-gray-300"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </Button>
        </NavbarItem>

        {/* Auth section */}
        {isAuthenticated ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform"
                color="primary"
                name={user?.username?.charAt(0).toUpperCase()}
                size="sm"
                showFallback
                fallback={
                  <UserIcon className="w-4 h-4 text-white" />
                }
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="用户菜单" variant="flat">
              <DropdownItem
                key="profile"
                className="h-14 gap-2"
                textValue="用户信息"
              >
                <p className="font-semibold">已登录</p>
                <p className="text-sm text-gray-500">{user?.username}</p>
              </DropdownItem>
              <DropdownItem
                key="settings"
                startContent={<UserIcon className="w-4 h-4" />}
                onPress={() => navigate('/profile')}
              >
                个人中心
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                onPress={handleLogout}
              >
                退出登录
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem className="hidden sm:flex">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-primary text-sm font-medium"
              >
                登录
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                to="/register"
                color="primary"
                variant="solid"
                size="sm"
              >
                注册
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu className="pt-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
        {navLinks.map((link) => (
          <NavbarMenuItem key={link.to}>
            <Link
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className={`w-full block py-3 text-lg ${
                isActiveLink(link.to)
                  ? 'text-primary font-medium'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {link.label}
            </Link>
          </NavbarMenuItem>
        ))}
        
        {/* Mobile auth links */}
        {!isAuthenticated && (
          <>
            <NavbarMenuItem className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full block py-3 text-lg text-gray-600 dark:text-gray-300"
              >
                登录
              </Link>
            </NavbarMenuItem>
          </>
        )}
        
        {isAuthenticated && (
          <>
            <NavbarMenuItem className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="w-full block py-3 text-lg text-gray-600 dark:text-gray-300"
              >
                个人中心
              </Link>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <button
                onClick={handleLogout}
                className="w-full text-left py-3 text-lg text-danger"
              >
                退出登录
              </button>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
    </HeroNavbar>
  )
}
