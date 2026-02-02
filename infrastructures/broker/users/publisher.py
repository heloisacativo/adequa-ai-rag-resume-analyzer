from dataclasses import dataclass, field
import json
from typing import final

import structlog
from faststream.kafka import KafkaBroker

from application.dtos.users.user import UserDTO
from application.interfaces.users.message_broker import MessageBrokerPublisherProtocol

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class KafkaUserPublisher(MessageBrokerPublisherProtocol):
    """
    Kafka implementation of the MessageBrokerPublisherProtocol for users.
    Publishes new user registration notifications to a Kafka topic.
    """

    broker: KafkaBroker
    topic: str = field(default="new_users")

    async def publish_new_user(
        self, user: UserDTO
    ) -> None:
        """
        Publishes a new user registration notification to Kafka.

        Args:
            user: The UserDTO to publish.

        Raises:
            Exception: If publishing the message fails.
        """
        try:
            user_dict = user.__dict__.copy()
            user_dict["email"] = str(user_dict["email"])  # Garante string
            await self.broker.publish(
                key=str(user.user_id),
                message=json.dumps(user_dict, ensure_ascii=False),
                topic=self.topic,
            )
        except Exception as e:
            logger = structlog.get_logger(__name__)
            logger.error("Failed to publish user", error=str(e))
            raise