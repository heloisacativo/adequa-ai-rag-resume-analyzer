from pathlib import Path
from typing import Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

class S3StorageService:
    """Serviço para armazenamento de arquivos no S3/DigitalOcean Spaces"""
    
    def __init__(
        self,
        endpoint_url: str,
        region: str,
        access_key: str,
        secret_key: str,
        bucket_name: str,
        folder_prefix: str = "uploaded_files"
    ):
        self.bucket_name = bucket_name
        self.folder_prefix = folder_prefix
        
        # Configura o cliente S3 para DigitalOcean Spaces
        self.s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )
        
        # Testa a conectividade
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Verifica se o bucket existe e tem acesso"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Conectado com sucesso ao bucket: {self.bucket_name}")
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                raise ValueError(f"Bucket '{self.bucket_name}' não encontrado")
            elif error_code == 403:
                raise ValueError(f"Acesso negado ao bucket '{self.bucket_name}'. Verifique as credenciais.")
            else:
                raise ValueError(f"Erro ao acessar bucket: {e}")
        except NoCredentialsError:
            raise ValueError("Credenciais AWS não configuradas")
    
    def upload_file(self, filename: str, content: bytes, extension: str) -> str:
        """
        Upload de arquivo para o S3
        
        Args:
            filename: Nome do arquivo
            content: Conteúdo do arquivo em bytes
            extension: Extensão do arquivo (ex: 'pdf', 'docx')
        
        Returns:
            String com a chave do arquivo no S3
        """
        try:
            # Remove o ponto da extensão se houver
            ext_clean = extension.replace('.', '')
            
            # Cria a chave no formato: uploaded_files/pdf/arquivo.pdf
            s3_key = f"{self.folder_prefix}/{ext_clean}/{filename}"
            
            # Upload para S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=content,
                ContentType=self._get_content_type(extension)
            )
            
            logger.info(f"Arquivo enviado com sucesso: {s3_key}")
            return s3_key
            
        except ClientError as e:
            logger.error(f"Erro ao fazer upload do arquivo {filename}: {e}")
            raise ValueError(f"Falha no upload: {e}")
    
    def download_file(self, s3_key: str) -> bytes:
        """
        Download de arquivo do S3
        
        Args:
            s3_key: Chave do arquivo no S3
            
        Returns:
            Conteúdo do arquivo em bytes
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response['Body'].read()
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise FileNotFoundError(f"Arquivo não encontrado: {s3_key}")
            else:
                logger.error(f"Erro ao fazer download do arquivo {s3_key}: {e}")
                raise ValueError(f"Falha no download: {e}")
    
    def file_exists(self, s3_key: str) -> bool:
        """Verifica se um arquivo existe no S3"""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False
    
    def delete_file(self, s3_key: str) -> bool:
        """Deleta um arquivo do S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"Arquivo deletado com sucesso: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Erro ao deletar arquivo {s3_key}: {e}")
            return False
    
    def _get_content_type(self, extension: str) -> str:
        """Retorna o content-type baseado na extensão"""
        content_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.txt': 'text/plain'
        }
        
        if not extension.startswith('.'):
            extension = f'.{extension}'
            
        return content_types.get(extension.lower(), 'application/octet-stream')