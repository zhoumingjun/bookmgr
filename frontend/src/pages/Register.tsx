import { Typography, Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Paragraph } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f5f5',
    }}>
      <Result
        status="403"
        title="自主注册已关闭"
        subTitle={
          <Paragraph style={{ textAlign: 'center' }}>
            本系统不支持自主注册账号。<br />
            如需开通账号，请联系课题超级管理员。
          </Paragraph>
        }
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            返回登录
          </Button>
        }
      />
    </div>
  );
}
